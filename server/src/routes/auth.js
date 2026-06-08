const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const { sendPasswordResetEmail } = require('../services/email');

const router = express.Router();
const prisma = new PrismaClient();

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function safeUser(user) {
  const { password, resetToken, resetTokenExpiry, failedLoginAttempts, lockUntil, ...rest } = user;
  return rest;
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, isStudent } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'name, email, and password are required' });
  }
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'Email already in use' });
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      isStudent: isStudent !== false,
      subscriptionTier: 'free',
      trialStartDate: new Date(),
    },
  });
  res.status(201).json({ token: signToken(user), user: safeUser(user) });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required' });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: 'No account found with that email address' });
  }

  // Check if account is locked
  if (user.lockUntil && user.lockUntil > new Date()) {
    return res.status(429).json({
      error: 'Too many failed attempts. Please wait 15 minutes before trying again.',
    });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    const newFailedAttempts = (user.failedLoginAttempts || 0) + 1;
    const updateData = { failedLoginAttempts: newFailedAttempts };

    if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
      updateData.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
      updateData.failedLoginAttempts = 0;
    }

    await prisma.user.update({ where: { id: user.id }, data: updateData });

    if (updateData.lockUntil) {
      return res.status(429).json({
        error: 'Too many failed attempts. Please wait 15 minutes before trying again.',
      });
    }
    return res.status(401).json({ error: 'Incorrect password. Please try again.' });
  }

  // Reset failed attempts on success
  if (user.failedLoginAttempts > 0 || user.lockUntil) {
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockUntil: null },
    });
  }

  res.json({ token: signToken(user), user: safeUser(user) });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'email is required' });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // Always respond the same way to prevent email enumeration
  if (!user) {
    return res.json({ message: 'If that email exists, a reset link was sent.' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken: token, resetTokenExpiry: expiry },
  });

  try {
    await sendPasswordResetEmail(email, token);
  } catch (err) {
    console.error('Failed to send reset email:', err);
    return res.status(500).json({ error: 'Failed to send reset email. Please try again.' });
  }

  res.json({ message: 'If that email exists, a reset link was sent.' });
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ error: 'token and password are required' });
  }

  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: { gt: new Date() },
    },
  });

  if (!user) {
    return res.status(400).json({ error: 'This reset link has expired. Please request a new one.' });
  }

  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashed,
      resetToken: null,
      resetTokenExpiry: null,
      failedLoginAttempts: 0,
      lockUntil: null,
    },
  });

  res.json({ message: 'Password updated successfully.' });
});

module.exports = router;
