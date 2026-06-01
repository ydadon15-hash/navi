const express = require('express');
const { PrismaClient } = require('@prisma/client');
const requireAuth = require('../middleware/requireAuth');
const Anthropic = require('@anthropic-ai/sdk');

const router = express.Router();
const prisma = new PrismaClient();

// ── Date helpers ───────────────────────────────────────────────────────────────
function todayLocalStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function tomorrowLocalStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// GET /api/studyplan  — fetch current plan for user
router.get('/', requireAuth, async (req, res) => {
  const days = await prisma.studyPlanDay.findMany({
    where: { userId: req.user.id },
    include: { tasks: true },
    orderBy: { date: 'asc' },
  });
  res.json(days);
});

// PATCH /api/studyplan/task/:id/complete  — toggle task completion
router.patch('/task/:id/complete', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const task = await prisma.studyPlanTask.findFirst({
    where: { id },
    include: { studyPlanDay: { select: { userId: true } } },
  });
  if (!task || task.studyPlanDay.userId !== req.user.id) {
    return res.status(404).json({ error: 'Task not found' });
  }
  const updated = await prisma.studyPlanTask.update({
    where: { id },
    data: { isCompleted: !task.isCompleted },
  });
  res.json(updated);
});

// GET /api/studyplan/rollover — incomplete tasks from past days
router.get('/rollover', requireAuth, async (req, res) => {
  try {
    const today = todayLocalStr();
    const days = await prisma.studyPlanDay.findMany({
      where: {
        userId: req.user.id,
        date: { lt: today },
      },
      include: { tasks: true },
    });

    const rolledOver = [];
    for (const day of days) {
      for (const task of day.tasks) {
        if (task.isCompleted) continue;
        // Skip if movedToDate is today or in the future
        if (task.movedToDate && task.movedToDate >= today) continue;
        rolledOver.push({
          taskId: task.id,
          description: task.description,
          estimatedMinutes: task.estimatedMinutes,
          classId: task.classId,
          originalDate: day.date,
          isCompleted: task.isCompleted,
        });
      }
    }

    res.json(rolledOver);
  } catch (e) {
    console.error('[StudyPlan] Rollover error:', e.message);
    res.status(500).json({ error: 'Failed to get rollover tasks' });
  }
});

// PATCH /api/studyplan/task/:id/push-tomorrow
router.patch('/task/:id/push-tomorrow', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const task = await prisma.studyPlanTask.findFirst({
      where: { id },
      include: { studyPlanDay: { select: { userId: true } } },
    });
    if (!task || task.studyPlanDay.userId !== req.user.id) {
      return res.status(404).json({ error: 'Task not found' });
    }
    const updated = await prisma.studyPlanTask.update({
      where: { id },
      data: {
        movedToDate: tomorrowLocalStr(),
        rolledOver: true,
      },
    });
    res.json(updated);
  } catch (e) {
    console.error('[StudyPlan] Push tomorrow error:', e.message);
    res.status(500).json({ error: 'Failed to push task' });
  }
});

// POST /api/studyplan/session — log a study session
router.post('/session', requireAuth, async (req, res) => {
  try {
    const { studyPlanDayId, taskId, studiedMinutes, sessionType } = req.body;
    if (!studiedMinutes || !sessionType) {
      return res.status(400).json({ error: 'studiedMinutes and sessionType are required' });
    }
    const session = await prisma.studySession.create({
      data: {
        userId: req.user.id,
        studyPlanDayId: studyPlanDayId ? parseInt(studyPlanDayId) : null,
        taskId: taskId ? parseInt(taskId) : null,
        studiedMinutes: parseInt(studiedMinutes),
        sessionType,
      },
    });
    res.json(session);
  } catch (e) {
    console.error('[StudyPlan] Session create error:', e.message);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// GET /api/studyplan/today-minutes — sum of studiedMinutes for today
router.get('/today-minutes', requireAuth, async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const sessions = await prisma.studySession.findMany({
      where: {
        userId: req.user.id,
        createdAt: { gte: startOfDay, lte: endOfDay },
      },
      select: { studiedMinutes: true },
    });

    const totalMinutes = sessions.reduce((sum, s) => sum + s.studiedMinutes, 0);
    res.json({ totalMinutes });
  } catch (e) {
    console.error('[StudyPlan] Today minutes error:', e.message);
    res.status(500).json({ error: 'Failed to get today minutes' });
  }
});

// POST /api/studyplan/generate  — generate (or regenerate) study plan
router.post('/generate', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    // ── Gather data ────────────────────────────────────────────────────────────
    const classes = await prisma.class.findMany({
      where: { userId },
      include: {
        assignments: {
          orderBy: { dueDate: 'asc' },
        },
        syllabi: {
          orderBy: { uploadedAt: 'desc' },
          take: 1,
        },
      },
    });

    // Rolled over incomplete tasks
    const today = new Date();
    const todayStr = todayLocalStr();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 13);
    const endStr = endDate.toISOString().slice(0, 10);

    const pastDays = await prisma.studyPlanDay.findMany({
      where: { userId, date: { lt: todayStr } },
      include: { tasks: true },
    });

    const rolledOverByClass = {};
    for (const day of pastDays) {
      for (const task of day.tasks) {
        if (!task.isCompleted && (!task.movedToDate || task.movedToDate < todayStr)) {
          rolledOverByClass[task.classId] = (rolledOverByClass[task.classId] || 0) + 1;
        }
      }
    }

    // Build context payload
    const classContext = classes.map(cls => {
      let syllabusSummary = null;
      if (cls.syllabi[0]?.summarizedJSON) {
        try { syllabusSummary = JSON.parse(cls.syllabi[0].summarizedJSON); } catch (_) {}
      }
      return {
        classId: cls.id,
        className: cls.name,
        currentGrade: cls.currentGrade ?? null,
        letterGrade: cls.letterGrade ?? null,
        rolledOverIncomplete: rolledOverByClass[cls.id] || 0,
        syllabusSummary,
        assignments: cls.assignments
          .filter(a => new Date(a.dueDate) >= today)
          .map(a => ({
            id: a.id,
            title: a.title,
            dueDate: a.dueDate.toISOString().slice(0, 10),
            isCompleted: a.isCompleted,
            pointsPossible: a.pointsPossible,
            difficulty: a.difficulty ?? null,
            isExam: /\b(exam|midterm|final|test|quiz)\b/i.test(a.title),
          })),
      };
    });

    const SYSTEM = `You are a study planner AI. The student gives you their class info, assignments (with difficulty ratings and exam flags), grades, rolled-over tasks, and syllabus data.
Return ONLY a valid raw JSON array — no markdown, no backticks, no preamble, no explanation, no extra text.

Each element of the array is an object with:
  "date": "YYYY-MM-DD"  (one of the next 14 days, starting ${todayStr})
  "tasks": array of:
    "classId": number
    "description": string  (specific, actionable, written in plain language)
    "estimatedMinutes": number

Rules:
- Cover the next 14 days from today (${todayStr}) through ${endStr}.
- Prioritize assignments due soonest.
- Allocate more study time to classes where currentGrade is lower or null.
- Hard assignments (difficulty="hard") get 2-3x more prep time than easy ones.
- Assignments with isExam=true need dedicated review days in the days leading up to the due date.
- Also check syllabusSummary.examDates for upcoming exams — schedule review for those too.
- Classes with rolledOverIncomplete > 0 need catch-up time allocated.
- Use weeklyTopics from the syllabus to suggest what to review each day.
- Weight study time toward items with higher percent in gradingBreakdown.
- Do not schedule tasks for days with no study need.
- 2–4 tasks per day maximum. Each 20–90 minutes.
- Only include classIds that exist in the provided class list.`;

    const userMessage = JSON.stringify(classContext, null, 2);

    let planDays;

    if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_anthropic_api_key_here') {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const message = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: SYSTEM,
        messages: [{ role: 'user', content: userMessage }],
      });
      const raw = message.content[0].text.trim();
      planDays = JSON.parse(raw);
    } else {
      planDays = generateFallbackPlan(classContext, todayStr);
    }

    // ── Persist to DB ──────────────────────────────────────────────────────────
    const existingDays = await prisma.studyPlanDay.findMany({ where: { userId } });
    const existingIds = existingDays.map(d => d.id);
    await prisma.studyPlanTask.deleteMany({ where: { studyPlanDayId: { in: existingIds } } });
    await prisma.studyPlanDay.deleteMany({ where: { userId } });

    const created = [];
    for (const day of planDays) {
      if (!day.date || !Array.isArray(day.tasks) || day.tasks.length === 0) continue;
      const dayRecord = await prisma.studyPlanDay.create({
        data: {
          userId,
          date: day.date,
          tasks: {
            create: day.tasks.map(t => ({
              classId: parseInt(t.classId),
              description: t.description,
              estimatedMinutes: parseInt(t.estimatedMinutes) || 30,
            })),
          },
        },
        include: { tasks: true },
      });
      created.push(dayRecord);
    }

    res.json(created);
  } catch (e) {
    console.error('[StudyPlan] Generate error:', e.message);
    res.status(500).json({ error: 'Failed to generate study plan: ' + e.message });
  }
});

// ── Fallback plan for when no API key is configured ─────────────────────────
function generateFallbackPlan(classContext, todayStr) {
  const days = [];
  const start = new Date(todayStr);

  const classIds = classContext.map(c => c.classId).filter(Boolean);
  if (classIds.length === 0) return days;

  for (let i = 0; i < 14; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue;

    const dateStr = d.toISOString().slice(0, 10);
    const tasks = [];

    const cls1 = classContext[i % classContext.length];
    const cls2 = classContext[(i + 1) % classContext.length];

    if (cls1) {
      tasks.push({
        classId: cls1.classId,
        description: `Review notes and complete practice problems for ${cls1.className}`,
        estimatedMinutes: 45,
      });
    }
    if (cls2 && cls2.classId !== cls1?.classId) {
      tasks.push({
        classId: cls2.classId,
        description: `Read assigned material and prepare questions for ${cls2.className}`,
        estimatedMinutes: 30,
      });
    }

    if (tasks.length > 0) days.push({ date: dateStr, tasks });
  }

  return days;
}

module.exports = router;
