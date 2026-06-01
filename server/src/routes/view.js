const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

function dayStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// GET /api/view/:token  (public, no auth)
router.get('/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const user = await prisma.user.findFirst({ where: { shareToken: token } });
    if (!user || !user.sharingEnabled) return res.status(404).json({ error: 'Not found' });

    const now = new Date();
    const in7 = new Date(now);
    in7.setDate(now.getDate() + 7);

    const classes = await prisma.class.findMany({
      where: { userId: user.id },
      include: {
        assignments: {
          where: { dueDate: { gte: now, lte: in7 } },
          orderBy: { dueDate: 'asc' },
        },
      },
    });

    // Compute streak from study sessions
    const sessions = await prisma.studySession.findMany({
      where: { userId: user.id },
      select: { createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    let streak = 0;
    if (sessions.length > 0) {
      const sessionDays = new Set(sessions.map(s => dayStr(new Date(s.createdAt))));
      const today = new Date();
      for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        if (sessionDays.has(dayStr(d))) streak++;
        else if (i > 0) break;
      }
    }

    const classesOut = classes.map(cls => ({
      id: cls.id,
      name: cls.name,
      colorIndex: cls.colorIndex,
      letterGrade: cls.letterGrade,
      currentPercentage: cls.currentGrade,
    }));

    const upcomingAssignments = [];
    for (const cls of classes) {
      for (const a of cls.assignments) {
        upcomingAssignments.push({
          title: a.title,
          dueDate: a.dueDate,
          isCompleted: a.isCompleted,
          className: cls.name,
          colorIndex: cls.colorIndex,
        });
      }
    }
    upcomingAssignments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    res.json({
      studentFirstName: user.name.split(' ')[0],
      classes: classesOut,
      upcomingAssignments,
      currentStreak: streak,
    });
  } catch (e) {
    console.error('[View] Error:', e.message);
    res.status(500).json({ error: 'Failed to load shared dashboard' });
  }
});

module.exports = router;
