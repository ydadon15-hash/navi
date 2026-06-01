const express = require('express');
const { PrismaClient } = require('@prisma/client');
const requireAuth = require('../middleware/requireAuth');
const { syncCanvasData } = require('../services/canvasSync');

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/canvas/sync
router.post('/sync', requireAuth, async (req, res) => {
  try {
    const result = await syncCanvasData(req.user.id);
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Sync failed' });
  }
});

// GET /api/canvas/status
router.get('/status', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { canvasToken: true, schoolName: true, lastSyncedAt: true },
  });
  res.json({
    isConnected: !!(user.canvasToken),
    schoolName: user.schoolName,
    lastSyncedAt: user.lastSyncedAt,
  });
});

module.exports = router;
