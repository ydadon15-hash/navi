const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const { syncCanvasData } = require('./services/canvasSync');

const prisma = new PrismaClient();

function startCron() {
  // Every 4 hours
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

  console.log('[Cron] Canvas auto-sync scheduled (every 4 hours)');
}

module.exports = { startCron };
