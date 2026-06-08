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
  console.log(`[GCalSync] Starting sync for user ${userId}`);

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
  console.log(`[GCalSync] Google API returned ${items.length} events for user ${userId}`);

  let saved = 0;
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

    console.log(`[GCalSync] Upserting event "${title}" (${googleEventId}) startTime=${startTime.toISOString()}`);
    try {
      await prisma.calendarEvent.upsert({
        where: { userId_googleEventId: { userId, googleEventId } },
        update: { title, startTime, endTime, location, description, updatedAt: new Date() },
        create: { userId, googleEventId, title, startTime, endTime, location, description },
      });
      saved++;
    } catch (e) {
      console.error(`[GCalSync] Failed to upsert event "${title}" (${googleEventId}):`, e.message);
    }
  }

  console.log(`[GCalSync] Saved ${saved}/${items.length} events for user ${userId}`);

  // Remove stale events that no longer appear in the next 7 days from Google
  const activeIds = items.map(e => e.id);
  const deleted = await prisma.calendarEvent.deleteMany({
    where: {
      userId,
      startTime: { gte: now, lte: in7Days },
      googleEventId: { notIn: activeIds },
    },
  });
  if (deleted.count > 0) {
    console.log(`[GCalSync] Removed ${deleted.count} stale events for user ${userId}`);
  }

  return items.length;
}

module.exports = { syncGoogleCalendar, getOAuth2Client };
