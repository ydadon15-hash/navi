const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.update({
  where: { email: 'alex@example.com' },
  data: { subscriptionTier: 'full' }
}).then(u => {
  console.log('Updated tier:', u.subscriptionTier);
  return prisma.$disconnect();
}).catch(e => {
  console.error(e);
  return prisma.$disconnect();
});
