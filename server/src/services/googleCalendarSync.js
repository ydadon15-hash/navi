const { google } = require('googleapis');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

/**
 * Fetch Google Calendar events for the next 7 days and upsert them in the DB.
 * @param {number} userId
 * @param {string} refreshToken
 */
async function syncGoogleCalendar(userId, refreshToken) {
  const auth = getOAuth2Client();
  auth.setCredentials({ refresh_token: refreshToken });

  const calendar = google.calendar({ version: 'v3', auth });

  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: now.toISOString(),
    timeMax: in7Days.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 100,
  });

  const items = response.data.items || [];

  for (const event of items) {
    const googleEventId = event.id;
    const title = event.summary || '(No title)';
    const startTime = event.start?.dateTime
      ? new Date(event.start.dateTime)
      : new Date(event.start?.date || now);
    const endTime = event.end?.dateTime
      ? new Date(event.end.dateTime)
      : event.end?.date
        ? new Date(event.end.date)
        : null;
    const location = event.location || null;
    const description = event.description || null;

    await prisma.calendarEvent.upsert({
      where: { userId_googleEventId: { userId, googleEventId } },
      update: { title, startTime, endTime, location, description, updatedAt: new Date() },
      create: { userId, googleEventId, title, startTime, endTime, location, description },
    });
  }

  // Remove stale events that no longer appear in the next 7 days from Google
  const activeIds = items.map(e => e.id);
  await prisma.calendarEvent.deleteMany({
    where: {
      userId,
      startTime: { gte: now, lte: in7Days },
      googleEventId: { notIn: activeIds },
    },
  });

  return items.length;
}

module.exports = { syncGoogleCalendar, getOAuth2Client };
