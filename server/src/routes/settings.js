const express = require('express');
const { PrismaClient } = require('@prisma/client');
const requireAuth = require('../middleware/requireAuth');
const crypto = require('crypto');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/settings
router.get('/', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      subscriptionTier: user.subscriptionTier,
      trialStartDate: user.trialStartDate,
      stripeCustomerId: user.stripeCustomerId,
      shareToken: user.shareToken,
      sharingEnabled: user.sharingEnabled,
      notificationPreferences: user.notificationPreferences
        ? JSON.parse(user.notificationPreferences)
        : { dueDateReminders: true, examCountdown: true, officeHoursReminders: false, weeklySummary: true },
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load settings' });
  }
});

// PATCH /api/settings/profile
router.patch('/profile', requireAuth, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name: name.trim() },
    });
    res.json({ name: user.name });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// POST /api/settings/share/enable
router.post('/share/enable', requireAuth, async (req, res) => {
  try {
    const token = crypto.randomBytes(32).toString('hex');
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { shareToken: token, sharingEnabled: true },
    });
    res.json({ shareToken: user.shareToken, sharingEnabled: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to enable sharing' });
  }
});

// POST /api/settings/share/disable
router.post('/share/disable', requireAuth, async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { sharingEnabled: false },
    });
    res.json({ sharingEnabled: false });
  } catch (e) {
    res.status(500).json({ error: 'Failed to disable sharing' });
  }
});

// POST /api/settings/share/regenerate
router.post('/share/regenerate', requireAuth, async (req, res) => {
  try {
    const token = crypto.randomBytes(32).toString('hex');
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { shareToken: token },
    });
    res.json({ shareToken: user.shareToken });
  } catch (e) {
    res.status(500).json({ error: 'Failed to regenerate share link' });
  }
});

// PATCH /api/settings/notifications
router.patch('/notifications', requireAuth, async (req, res) => {
  try {
    const prefs = req.body;
    await prisma.user.update({
      where: { id: req.user.id },
      data: { notificationPreferences: JSON.stringify(prefs) },
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to save notification preferences' });
  }
});

// DELETE /api/settings/account
router.delete('/account', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const classes = await prisma.class.findMany({ where: { userId }, select: { id: true } });
    const classIds = classes.map(c => c.id);

    await prisma.assignment.deleteMany({ where: { classId: { in: classIds } } });
    await prisma.syllabus.deleteMany({ where: { classId: { in: classIds } } });
    await prisma.class.deleteMany({ where: { userId } });

    const studyDays = await prisma.studyPlanDay.findMany({ where: { userId }, select: { id: true } });
    const dayIds = studyDays.map(d => d.id);
    await prisma.studyPlanTask.deleteMany({ where: { studyPlanDayId: { in: dayIds } } });
    await prisma.studyPlanDay.deleteMany({ where: { userId } });

    await prisma.studySession.deleteMany({ where: { userId } });
    await prisma.dayNote.deleteMany({ where: { userId } });
    await prisma.dayTask.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });

    res.json({ ok: true });
  } catch (e) {
    console.error('[Settings] Delete account error:', e.message);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

module.exports = router;
