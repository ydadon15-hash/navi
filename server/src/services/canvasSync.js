const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function canvasFetch(domain, token, path) {
  const url = `https://${domain}/api/v1${path}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Canvas API ${res.status} at ${path}`);
  return res.json();
}

async function getFallback(userId) {
  const classes = await prisma.class.findMany({ where: { userId }, orderBy: { id: 'asc' } });
  const assignments = await prisma.assignment.findMany({
    where: { class: { userId } },
    include: { class: true },
    orderBy: { dueDate: 'asc' },
  });
  return { classes, assignments, synced: false };
}

async function syncCanvasData(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  if (!user.canvasToken || !user.schoolName) {
    return getFallback(userId);
  }

  try {
    const domain = user.schoolName; // treated as Canvas domain, e.g. "canvas.university.edu"

    const courses = await canvasFetch(domain, user.canvasToken,
      '/courses?enrollment_state=active&enrollment_type=student&per_page=50');

    const classes = [];
    const assignments = [];
    let colorCounter = 0;

    for (const course of courses) {
      colorCounter++;
      const colorIndex = ((colorCounter - 1) % 4) + 1;

      // Upsert class by canvasCourseId
      let cls = await prisma.class.findFirst({
        where: { canvasCourseId: String(course.id), userId },
      });
      if (cls) {
        cls = await prisma.class.update({
          where: { id: cls.id },
          data: { name: course.name },
        });
      } else {
        cls = await prisma.class.create({
          data: { userId, name: course.name, canvasCourseId: String(course.id), colorIndex },
        });
      }

      // Fetch assignments for this course
      const canvasAsgns = await canvasFetch(domain, user.canvasToken,
        `/courses/${course.id}/assignments?per_page=100&include[]=submission`);

      for (const a of canvasAsgns) {
        const isCompleted = a.submission?.workflow_state === 'submitted' ||
                            a.submission?.workflow_state === 'graded';
        const pointsEarned = a.submission?.score ?? null;

        let existing = await prisma.assignment.findFirst({
          where: { canvasAssignmentId: String(a.id) },
        });
        if (existing) {
          existing = await prisma.assignment.update({
            where: { id: existing.id },
            data: {
              title: a.name,
              dueDate: a.due_at ? new Date(a.due_at) : existing.dueDate,
              pointsPossible: a.points_possible ?? existing.pointsPossible,
              pointsEarned,
              isCompleted,
            },
          });
        } else {
          existing = await prisma.assignment.create({
            data: {
              classId: cls.id,
              title: a.name,
              dueDate: a.due_at ? new Date(a.due_at) : new Date(),
              pointsPossible: a.points_possible,
              pointsEarned,
              isCompleted,
              canvasAssignmentId: String(a.id),
            },
          });
        }
        assignments.push(existing);
      }

      // Fetch grade from enrollments
      const enrollments = await canvasFetch(domain, user.canvasToken,
        `/courses/${course.id}/enrollments?type[]=StudentEnrollment&user_id=self`);

      if (enrollments.length > 0 && enrollments[0].grades) {
        const g = enrollments[0].grades;
        cls = await prisma.class.update({
          where: { id: cls.id },
          data: {
            currentGrade: g.current_score ?? cls.currentGrade,
            letterGrade: g.current_grade ?? cls.letterGrade,
          },
        });
      }

      classes.push(cls);
    }

    await prisma.user.update({
      where: { id: userId },
      data: { lastSyncedAt: new Date() },
    });

    return { classes, assignments, synced: true };

  } catch (err) {
    console.error(`[Canvas] Sync failed for user ${userId}: ${err.message}`);
    return getFallback(userId);
  }
}

module.exports = { syncCanvasData };
