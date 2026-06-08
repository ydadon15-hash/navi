const express = require('express');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const requireAuth = require('../middleware/requireAuth');
const { getOAuth2Client, syncGoogleCalendar } = require('../services/googleCalendarSync');

const router = express.Router();
const prisma = new PrismaClient();

const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

/**
 * GET /api/google/auth?token=<jwt>
 * Browser redirect — starts the OAuth flow.
 * The JWT is passed as a query param because this is a full-page redirect, not an XHR.
 */
router.get('/auth', (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'Missing token' });

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }

  const oauth2Client = getOAuth2Client();
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
    state: String(payload.id),
  });

  res.redirect(url);
});

/**
 * GET /api/google/callback
 * Google redirects here after the user grants access.
 */
router.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'https://navi-eosin-alpha.vercel.app';

  if (!code || !state) {
    return res.redirect(`${frontendUrl}/onboarding?gcal=error`);
  }

  const userId = parseInt(state, 10);
  if (isNaN(userId)) {
    return res.redirect(`${frontendUrl}/onboarding?gcal=error`);
  }

  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.refresh_token) {
      // Google only sends refresh_token on first consent — if missing, the user
      // must have already connected before. Try to keep whatever we stored.
      return res.redirect(`${frontendUrl}/onboarding?gcal=connected`);
    }

    await prisma.user.update({
      where: { id: userId },
      data: { googleRefreshToken: tokens.refresh_token },
    });

    // Immediately sync so events appear the moment the user lands on the dashboard
    try {
      await syncGoogleCalendar(userId, tokens.refresh_token);
      console.log(`[Google OAuth] Initial sync complete for user ${userId}`);
    } catch (e) {
      console.error(`[Google OAuth] Initial sync failed for user ${userId}:`, e.message);
      // Non-fatal — redirect regardless so the user isn't left hanging
    }

    res.redirect(`${frontendUrl}/onboarding?gcal=connected`);
  } catch (e) {
    console.error('[Google OAuth] callback error:', e.message);
    res.redirect(`${frontendUrl}/onboarding?gcal=error`);
  }
});

/**
 * GET /api/google/status
 * Returns whether the current user has Google Calendar connected.
 */
router.get('/status', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { googleRefreshToken: true },
    });
    res.json({ connected: !!user?.googleRefreshToken });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET /api/google/events
 * Returns stored CalendarEvents for this user for the next 7 days.
 */
router.get('/events', requireAuth, async (req, res) => {
  try {
    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    console.log(`[GCal/events] Fetching events for user ${req.user.id}, range: ${now.toISOString()} – ${in7Days.toISOString()}`);

    const events = await prisma.calendarEvent.findMany({
      where: {
        userId: req.user.id,
        startTime: { gte: now, lte: in7Days },
      },
      orderBy: { startTime: 'asc' },
    });

    console.log(`[GCal/events] Returning ${events.length} events for user ${req.user.id}`);
    res.json(events);
  } catch (e) {
    console.error(`[GCal/events] Error for user ${req.user.id}:`, e.message);
    res.status(500).json({ error: e.message });
  }
});

/**
 * DELETE /api/google/disconnect
 * Clears the stored refresh token, effectively disconnecting Google Calendar.
 */
router.delete('/disconnect', requireAuth, async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { googleRefreshToken: null },
    });
    res.json({ disconnected: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * POST /api/google/sync
 * Manually trigger a sync for the current user (useful for testing).
 */
router.post('/sync', requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { googleRefreshToken: true },
    });

    if (!user?.googleRefreshToken) {
      return res.status(400).json({ error: 'Google Calendar not connected' });
    }

    const count = await syncGoogleCalendar(req.user.id, user.googleRefreshToken);
    res.json({ synced: count });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
