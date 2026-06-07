const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const { syncCanvasData } = require('./services/canvasSync');
const { syncGoogleCalendar } = require('./services/googleCalendarSync');

const prisma = new PrismaClient();

function startCron() {
  // ── Canvas sync — every 4 hours ──────────────────────────────────────
  cron.schedule('0 */4 * * *', async () => {
    console.log('[Cron] Starting scheduled Canvas sync...');
    try {
      const users = await prisma.user.findMany({
        where: { canvasToken: { not: null } },
        select: { id: true, email: true },
      });
      console.log(`[Cron] Found ${users.length} user(s) with Canvas token`);
      for (const user of users) {
        try {
          const { classes, assignments } = await syncCanvasData(user.id);
          console.log(`[Cron] Synced user ${user.id} (${user.email}): ${classes.length} classes, ${assignments.length} assignments`);
        } catch (e) {
          console.error(`[Cron] Failed for user ${user.id}: ${e.message}`);
        }
      }
    } catch (e) {
      console.error('[Cron] Error querying users:', e.message);
    }
  });

  // ── Google Calendar sync — every day at 7 AM ─────────────────────────
  cron.schedule('0 7 * * *', async () => {
    console.log('[Cron] Starting scheduled Google Calendar sync...');
    try {
      const users = await prisma.user.findMany({
        where: { googleRefreshToken: { not: null } },
        select: { id: true, email: true, googleRefreshToken: true },
      });
      console.log(`[Cron] Found ${users.length} user(s) with Google Calendar connected`);
      for (const user of users) {
        try {
          const count = await syncGoogleCalendar(user.id, user.googleRefreshToken);
          console.log(`[Cron] Google Calendar synced user ${user.id} (${user.email}): ${count} events`);
        } catch (e) {
          console.error(`[Cron] Google Calendar failed for user ${user.id}: ${e.message}`);
        }
      }
    } catch (e) {
      console.error('[Cron] Error querying users for Google Calendar sync:', e.message);
    }
  });

  console.log('[Cron] Canvas auto-sync scheduled (every 4 hours)');
  console.log('[Cron] Google Calendar sync scheduled (daily at 7 AM)');
}

module.exports = { startCron };
