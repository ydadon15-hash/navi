const express = require('express');
const { PrismaClient } = require('@prisma/client');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();
const prisma = new PrismaClient();

// Helpers
function dayBounds(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return {
    start: new Date(y, m - 1, d, 0, 0, 0, 0),
    end:   new Date(y, m - 1, d, 23, 59, 59, 999),
  };
}

// GET /api/day/indicators?year=Y&month=M
// Returns dates in the month that have a non-empty note or ≥1 task
router.get('/indicators', requireAuth, async (req, res) => {
  const year  = parseInt(req.query.year)  || new Date().getFullYear();
  const month = parseInt(req.query.month) || (new Date().getMonth() + 1);
  const daysInMonth = new Date(year, month, 0).getDate();

  const dates = Array.from({ length: daysInMonth }, (_, i) => {
    const d = i + 1;
    return `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  });

  const [notes, tasks] = await Promise.all([
    prisma.dayNote.findMany({
      where: { userId: req.user.id, date: { in: dates }, NOT: { note: '' } },
      select: { date: true },
    }),
    prisma.dayTask.findMany({
      where: { userId: req.user.id, date: { in: dates } },
      select: { date: true },
    }),
  ]);

  const withData = new Set([...notes.map(n => n.date), ...tasks.map(t => t.date)]);
  res.json({ dates: [...withData] });
});

// GET /api/day/:date  — note + tasks + Canvas assignments for that date
router.get('/:date', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const { date } = req.params;
  const { start, end } = dayBounds(date);

  const [dayNote, dayTasks, assignments] = await Promise.all([
    prisma.dayNote.findFirst({ where: { userId, date } }),
    prisma.dayTask.findMany({ where: { userId, date }, orderBy: { createdAt: 'asc' } }),
    prisma.assignment.findMany({
      where: { dueDate: { gte: start, lte: end }, class: { userId } },
      include: { class: { select: { name: true, colorIndex: true } } },
      orderBy: { dueDate: 'asc' },
    }),
  ]);

  res.json({ note: dayNote?.note ?? '', tasks: dayTasks, assignments });
});

// POST /api/day/:date/note  — upsert the day note
router.post('/:date/note', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const { date } = req.params;
  const { note = '' } = req.body;

  const existing = await prisma.dayNote.findFirst({ where: { userId, date } });
  if (existing) {
    const updated = await prisma.dayNote.update({ where: { id: existing.id }, data: { note } });
    return res.json(updated);
  }
  const created = await prisma.dayNote.create({ data: { userId, date, note } });
  res.json(created);
});

// POST /api/day/:date/task  — create a new day task
router.post('/:date/task', requireAuth, async (req, res) => {
  const userId = req.user.id;
  const { date } = req.params;
  const { title } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'title is required' });

  const task = await prisma.dayTask.create({
    data: { userId, date, title: title.trim() },
  });
  res.json(task);
});

// PATCH /api/day/task/:id/complete  — toggle isCompleted
router.patch('/task/:id/complete', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const existing = await prisma.dayTask.findFirst({ where: { id, userId: req.user.id } });
  if (!existing) return res.status(404).json({ error: 'Task not found' });
  const updated = await prisma.dayTask.update({
    where: { id },
    data: { isCompleted: !existing.isCompleted },
  });
  res.json(updated);
});

// DELETE /api/day/task/:id
router.delete('/task/:id', requireAuth, async (req, res) => {
  const id = parseInt(req.params.id);
  const existing = await prisma.dayTask.findFirst({ where: { id, userId: req.user.id } });
  if (!existing) return res.status(404).json({ error: 'Task not found' });
  await prisma.dayTask.delete({ where: { id } });
  res.json({ ok: true });
});

module.exports = router;
