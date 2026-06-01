const express = require('express');
const { PrismaClient } = require('@prisma/client');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();
const prisma = new PrismaClient();

function getWeekStart() {
  const now = new Date();
  const dow = now.getDay();
  const daysToMon = dow === 0 ? -6 : 1 - dow;
  const mon = new Date(now);
  mon.setDate(now.getDate() + daysToMon);
  mon.setHours(0, 0, 0, 0);
  return mon;
}

// GET /api/performance
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const weekStart = getWeekStart();
    const now = new Date();

    const [classes, sessions] = await Promise.all([
      prisma.class.findMany({
        where: { userId },
        include: {
          assignments: { orderBy: { dueDate: 'asc' } },
          syllabi: { orderBy: { uploadedAt: 'desc' }, take: 1 },
        },
      }),
      prisma.studySession.findMany({
        where: { userId, createdAt: { gte: weekStart } },
        select: { studiedMinutes: true, taskId: true },
      }),
    ]);

    const taskIds = sessions.filter(s => s.taskId).map(s => s.taskId);
    let taskClassMap = {};
    if (taskIds.length > 0) {
      const tasks = await prisma.studyPlanTask.findMany({
        where: { id: { in: taskIds } },
        select: { id: true, classId: true },
      });
      for (const t of tasks) taskClassMap[t.id] = t.classId;
    }

    const weekMinutesByClass = {};
    for (const sess of sessions) {
      const classId = taskClassMap[sess.taskId];
      if (classId) {
        weekMinutesByClass[classId] = (weekMinutesByClass[classId] || 0) + sess.studiedMinutes;
      }
    }

    const classData = classes.map(cls => {
      const graded = cls.assignments
        .filter(a => a.pointsEarned != null && a.pointsPossible != null && a.pointsPossible > 0)
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

      const lastGradedAssignments = graded.slice(-5);
      const remaining = cls.assignments.filter(
        a => !a.isCompleted && new Date(a.dueDate) > now && a.pointsPossible != null
      );

      let syllabusJSON = null;
      if (cls.syllabi[0]?.summarizedJSON) {
        try { syllabusJSON = JSON.parse(cls.syllabi[0].summarizedJSON); } catch (_) {}
      }

      return {
        id: cls.id,
        name: cls.name,
        colorIndex: cls.colorIndex,
        currentGrade: cls.currentGrade,
        letterGrade: cls.letterGrade,
        lastGradedAssignments: lastGradedAssignments.map(a => ({
          title: a.title,
          pointsEarned: a.pointsEarned,
          pointsPossible: a.pointsPossible,
          dueDate: a.dueDate,
        })),
        remainingAssignments: remaining.map(a => ({
          title: a.title,
          pointsPossible: a.pointsPossible,
        })),
        syllabusJSON,
      };
    });

    res.json({ classes: classData, weekMinutesByClass });
  } catch (e) {
    console.error('[Performance] Error:', e.message);
    res.status(500).json({ error: 'Failed to load performance data' });
  }
});

module.exports = router;
