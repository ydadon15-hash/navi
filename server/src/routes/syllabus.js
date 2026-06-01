const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { PrismaClient } = require('@prisma/client');
const requireAuth = require('../middleware/requireAuth');
const Anthropic = require('@anthropic-ai/sdk');

const router = express.Router();
const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

const SYSTEM_PROMPT = `You are a syllabus parser. Extract structured information from the provided syllabus text and return ONLY a valid raw JSON object. No markdown, no backticks, no preamble, no explanation, no extra text of any kind. Just the raw JSON object.

The JSON must have exactly these fields:
{
  "gradingBreakdown": [{ "label": string, "percent": number }],
  "examDates": [{ "title": string, "date": string }],
  "latePolicy": string,
  "attendancePolicy": string,
  "officeHours": string,
  "requiredMaterials": [string],
  "weeklyTopics": [{ "week": number, "topic": string }]
}

Use empty arrays or empty strings for any field not found in the syllabus.`;

function getFallbackSummary() {
  return {
    gradingBreakdown: [
      { label: 'Exams', percent: 40 },
      { label: 'Homework', percent: 30 },
      { label: 'Participation', percent: 15 },
      { label: 'Final Project', percent: 15 },
    ],
    examDates: [
      { title: 'Midterm Exam', date: 'Week 8' },
      { title: 'Final Exam', date: 'Week 16' },
    ],
    latePolicy: 'Late assignments lose 10% per day, up to 3 days.',
    attendancePolicy: 'More than 3 unexcused absences may affect your grade.',
    officeHours: 'Tuesdays and Thursdays 2–4 PM, or by appointment.',
    requiredMaterials: ['Course textbook (see syllabus)', 'Notebook or laptop for notes'],
    weeklyTopics: [],
  };
}

// POST /api/syllabus/upload
router.post('/upload', requireAuth, upload.single('file'), async (req, res) => {
  try {
    const { classId } = req.body;
    if (!classId) return res.status(400).json({ error: 'classId is required' });
    if (!req.file) return res.status(400).json({ error: 'PDF file is required' });

    const cls = await prisma.class.findFirst({
      where: { id: parseInt(classId), userId: req.user.id },
    });
    if (!cls) return res.status(404).json({ error: 'Class not found' });

    const parsed = await pdfParse(req.file.buffer);
    const rawText = parsed.text.slice(0, 12000);

    let summarizedJSON = null;

    if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_anthropic_api_key_here') {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const message = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: rawText }],
      });
      const text = message.content[0].text.trim();
      summarizedJSON = JSON.stringify(JSON.parse(text));
    } else {
      summarizedJSON = JSON.stringify(getFallbackSummary());
    }

    const syllabus = await prisma.syllabus.create({
      data: {
        classId: cls.id,
        rawText,
        summarizedJSON,
      },
    });

    res.json({ id: syllabus.id, classId: cls.id, summary: JSON.parse(summarizedJSON) });
  } catch (e) {
    console.error('[Syllabus] Upload error:', e.message);
    res.status(500).json({ error: 'Failed to process syllabus' });
  }
});

// GET /api/syllabus/:classId
router.get('/:classId', requireAuth, async (req, res) => {
  const classId = parseInt(req.params.classId);

  const cls = await prisma.class.findFirst({
    where: { id: classId, userId: req.user.id },
  });
  if (!cls) return res.status(404).json({ error: 'Class not found' });

  const syllabi = await prisma.syllabus.findMany({
    where: { classId },
    orderBy: { uploadedAt: 'desc' },
  });

  res.json(
    syllabi.map((s) => ({
      id: s.id,
      classId: s.classId,
      uploadedAt: s.uploadedAt,
      summary: s.summarizedJSON ? JSON.parse(s.summarizedJSON) : null,
    }))
  );
});

module.exports = router;
