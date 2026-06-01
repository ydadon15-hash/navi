const express = require('express');
const { PrismaClient } = require('@prisma/client');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();
const prisma = new PrismaClient();

// Returns the Monday of the current week at 00:00 local time
function getWeekBounds() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun … 6=Sat
  const daysToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const mon = new Date(now);
  mon.setDate(now.getDate() + daysToMon);
  mon.setHours(0, 0, 0, 0);

  const fri = new Date(mon);
  fri.setDate(mon.getDate() + 4);
  fri.setHours(23, 59, 59, 999);

  return { mon, fri };
}

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri'];

// GET /api/assignments/week
router.get('/week', requireAuth, async (req, res) => {
  const { mon, fri } = getWeekBounds();

  const assignments = await prisma.assignment.findMany({
    where: {
      dueDate: { gte: mon, lte: fri },
      class: { userId: req.user.id },
    },
    include: { class: { select: { name: true, colorIndex: true } } },
    orderBy: { dueDate: 'asc' },
  });

  const grouped = { mon: [], tue: [], wed: [], thu: [], fri: [] };
  for (const a of assignments) {
    const d = new Date(a.dueDate);
    const dow = d.getDay(); // 1=Mon … 5=Fri
    if (dow >= 1 && dow <= 5) {
      grouped[DAY_KEYS[dow - 1]].push(a);
    }
  }

  res.json(grouped);
});

// GET /api/assignments/month?year=YYYY&month=M
router.get('/month', requireAuth, async (req, res) => {
  const year  = parseInt(req.query.year)  || new Date().getFullYear();
  const month = parseInt(req.query.month) || (new Date().getMonth() + 1);

  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end   = new Date(year, month, 0, 23, 59, 59, 999);

  const assignments = await prisma.assignment.findMany({
    where: {
      dueDate: { gte: start, lte: end },
      class: { userId: req.user.id },
    },
    include: { class: { select: { name: true, colorIndex: true } } },
    orderBy: { dueDate: 'asc' },
  });

  res.json(assignments);
});

// GET /api/assignments/:id/note
router.get('/:id/note', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const a = await prisma.assignment.findFirst({
    where: { id, class: { userId: req.user.id } },
    select: { id: true, note: true },
  });
  if (!a) return res.status(404).json({ error: 'Assignment not found' });
  res.json({ id: a.id, note: a.note });
});

// PATCH /api/assignments/:id/note
router.patch('/:id/note', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const { note } = req.body;
  const existing = await prisma.assignment.findFirst({
    where: { id, class: { userId: req.user.id } },
  });
  if (!existing) return res.status(404).json({ error: 'Assignment not found' });
  const updated = await prisma.assignment.update({
    where: { id },
    data: { note: note ?? null },
  });
  res.json(updated);
});

// PATCH /api/assignments/:id/complete
router.patch('/:id/complete', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const existing = await prisma.assignment.findFirst({
    where: { id, class: { userId: req.user.id } },
  });
  if (!existing) return res.status(404).json({ error: 'Assignment not found' });
  const updated = await prisma.assignment.update({
    where: { id },
    data: { isCompleted: !existing.isCompleted },
  });
  res.json(updated);
});

// PATCH /api/assignments/:id/difficulty
router.patch('/:id/difficulty', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const { difficulty } = req.body;
  if (!['easy', 'medium', 'hard'].includes(difficulty)) {
    return res.status(400).json({ error: 'difficulty must be easy, medium, or hard' });
  }
  const existing = await prisma.assignment.findFirst({
    where: { id, class: { userId: req.user.id } },
  });
  if (!existing) return res.status(404).json({ error: 'Assignment not found' });
  const updated = await prisma.assignment.update({
    where: { id },
    data: { difficulty },
  });
  res.json(updated);
});

module.exports = router;
