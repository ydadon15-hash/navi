const express = require('express');
const { PrismaClient } = require('@prisma/client');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();
const prisma = new PrismaClient();

const CANVAS_SEED = [
  { name: 'Calculus II',      colorIndex: 1, currentGrade: 88.5, letterGrade: 'B+' },
  { name: 'Art History',      colorIndex: 2, currentGrade: 92.0, letterGrade: 'A-' },
  { name: 'Intro to Biology', colorIndex: 3, currentGrade: 79.0, letterGrade: 'C+' },
  { name: 'Philosophy 101',   colorIndex: 4, currentGrade: 95.0, letterGrade: 'A'  },
];

// POST /api/classes/canvas-sync  — must be before '/'
router.post('/canvas-sync', requireAuth, async (req, res) => {
  try {
    const existing = await prisma.class.findMany({ where: { userId: req.user.id } });
    if (existing.length > 0) return res.json({ classes: existing });

    const classes = await Promise.all(
      CANVAS_SEED.map(c => prisma.class.create({ data: { ...c, userId: req.user.id } }))
    );
    res.json({ classes });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Canvas sync failed' });
  }
});

// GET /api/classes
router.get('/', requireAuth, async (req, res) => {
  const classes = await prisma.class.findMany({
    where: { userId: req.user.id },
    orderBy: { id: 'asc' },
  });
  res.json(classes);
});

// POST /api/classes
router.post('/', requireAuth, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  const count = await prisma.class.count({ where: { userId: req.user.id } });
  const colorIndex = (count % 4) + 1;

  const cls = await prisma.class.create({
    data: { name, colorIndex, userId: req.user.id },
  });
  res.status(201).json(cls);
});

module.exports = router;
