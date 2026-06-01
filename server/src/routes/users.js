const express = require('express');
const { PrismaClient } = require('@prisma/client');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true, name: true, email: true, isStudent: true,
      schoolName: true, onboardingComplete: true,
      subscriptionTier: true, trialStartDate: true, createdAt: true,
    },
  });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

router.patch('/me', requireAuth, async (req, res) => {
  const allowed = ['onboardingComplete', 'schoolName', 'isStudent', 'canvasToken'];
  const data = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) data[key] = req.body[key];
  }
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data,
    select: {
      id: true, name: true, email: true, isStudent: true,
      schoolName: true, onboardingComplete: true, subscriptionTier: true,
    },
  });
  res.json(user);
});

module.exports = router;
