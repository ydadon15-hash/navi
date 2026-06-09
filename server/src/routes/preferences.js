const express = require('express');
const { PrismaClient } = require('@prisma/client');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/preferences — return current user's preferences (create defaults if none exist yet)
router.get('/', requireAuth, async (req, res) => {
  try {
    const prefs = await prisma.userPreferences.upsert({
      where:  { userId: req.user.id },
      update: {},
      create: { userId: req.user.id },
    });
    res.json(prefs);
  } catch (err) {
    console.error('GET /api/preferences error:', err);
    res.status(500).json({ error: 'Failed to load preferences' });
  }
});

// POST /api/preferences — save/update current user's preferences
router.post('/', requireAuth, async (req, res) => {
  const { bgColor, borderColor, accentColor, borderStyle, greetingName, presetName } = req.body;

  const data = {};
  if (bgColor      !== undefined) data.bgColor      = bgColor;
  if (borderColor  !== undefined) data.borderColor  = borderColor;
  if (accentColor  !== undefined) data.accentColor  = accentColor;
  if (borderStyle  !== undefined) data.borderStyle  = borderStyle;
  if (greetingName !== undefined) data.greetingName = greetingName;
  if (presetName   !== undefined) data.presetName   = presetName;

  try {
    const prefs = await prisma.userPreferences.upsert({
      where:  { userId: req.user.id },
      update: data,
      create: { userId: req.user.id, ...data },
    });
    res.json(prefs);
  } catch (err) {
    console.error('POST /api/preferences error:', err);
    res.status(500).json({ error: 'Failed to save preferences' });
  }
});

module.exports = router;
