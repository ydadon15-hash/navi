const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  // Clear existing data
  await prisma.assignment.deleteMany()
  await prisma.syllabus.deleteMany()
  await prisma.studyPlanDay.deleteMany()
  await prisma.class.deleteMany()
  await prisma.user.deleteMany()

  const user = await prisma.user.create({
    data: {
      name: 'Alex Rivera',
      email: 'alex@example.com',
      password: await bcrypt.hash('test1234', 10),
      isStudent: true,
      schoolName: 'State University',
      onboardingComplete: true,
      subscriptionTier: 'core',
    },
  })

  const classes = await Promise.all([
    prisma.class.create({ data: { userId: user.id, name: 'Calculus II',      colorIndex: 1, currentGrade: 88.5, letterGrade: 'B+' } }),
    prisma.class.create({ data: { userId: user.id, name: 'Art History',      colorIndex: 2, currentGrade: 92.0, letterGrade: 'A-' } }),
    prisma.class.create({ data: { userId: user.id, name: 'Intro to Biology', colorIndex: 3, currentGrade: 79.0, letterGrade: 'C+' } }),
    prisma.class.create({ data: { userId: user.id, name: 'Philosophy 101',   colorIndex: 4, currentGrade: 95.0, letterGrade: 'A'  } }),
  ])

  // Build dates relative to today (current week)
  const today = new Date()
  const day = (offset) => {
    const d = new Date(today)
    d.setDate(d.getDate() + offset)
    d.setHours(23, 59, 0, 0)
    return d
  }

  await Promise.all([
    prisma.assignment.create({
      data: {
        classId: classes[0].id,
        title: 'Problem Set 7 — Integration by Parts',
        dueDate: day(-1),
        isCompleted: true,
        pointsPossible: 50,
        pointsEarned: 44,
      },
    }),
    prisma.assignment.create({
      data: {
        classId: classes[1].id,
        title: 'Renaissance Reading Response',
        dueDate: day(-1),
        isCompleted: true,
        pointsPossible: 30,
        pointsEarned: 28,
      },
    }),
    prisma.assignment.create({
      data: {
        classId: classes[2].id,
        title: 'Lab Report: Cell Mitosis',
        dueDate: day(1),
        isCompleted: false,
        pointsPossible: 100,
        pointsEarned: null,
        note: 'Need to include microscope diagrams',
      },
    }),
    prisma.assignment.create({
      data: {
        classId: classes[3].id,
        title: 'Essay: The Ship of Theseus',
        dueDate: day(2),
        isCompleted: false,
        pointsPossible: 75,
        pointsEarned: null,
        note: 'Min 1500 words, cite at least 3 sources',
      },
    }),
    prisma.assignment.create({
      data: {
        classId: classes[0].id,
        title: 'Midterm Exam Review',
        dueDate: day(3),
        isCompleted: false,
        pointsPossible: 200,
        pointsEarned: null,
      },
    }),
    prisma.assignment.create({
      data: {
        classId: classes[2].id,
        title: 'Chapter 8 Quiz — Genetics',
        dueDate: day(4),
        isCompleted: false,
        pointsPossible: 25,
        pointsEarned: null,
      },
    }),
  ])

  console.log('✓ Seeded: 1 user, 4 classes, 6 assignments')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
