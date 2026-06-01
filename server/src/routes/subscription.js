const express = require('express');
const { PrismaClient } = require('@prisma/client');
const requireAuth = require('../middleware/requireAuth');

const router = express.Router();
const prisma = new PrismaClient();

const BASE_URL = process.env.APP_BASE_URL || 'http://localhost:5173';

let _stripe = null;
function getStripe() {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (key && key !== 'your_stripe_secret_key_here') {
    _stripe = require('stripe')(key);
  }
  return _stripe;
}

// Exported separately so index.js can mount it with raw body before express.json()
async function webhookHandler(req, res) {
  const s = getStripe();
  if (!s) return res.status(503).json({ error: 'Stripe not configured' });
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = s.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    return res.status(400).send(`Webhook Error: ${e.message}`);
  }
  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = parseInt(session.metadata.userId);
      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionTier: 'core',
          stripeCustomerId: session.customer,
          stripeSubscriptionId: session.subscription,
        },
      });
    } else if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object;
      const user = await prisma.user.findFirst({ where: { stripeSubscriptionId: sub.id } });
      if (user) {
        await prisma.user.update({ where: { id: user.id }, data: { subscriptionTier: 'free' } });
      }
    }
    res.json({ received: true });
  } catch (e) {
    console.error('[Webhook] Error:', e.message);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
}

// POST /api/subscription/checkout
router.post('/checkout', requireAuth, async (req, res) => {
  const s = getStripe();
  if (!s) return res.status(503).json({ error: 'Stripe not configured' });
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const session = await s.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${BASE_URL}/dashboard?upgraded=true`,
      cancel_url: `${BASE_URL}/pricing`,
      customer_email: user.email,
      metadata: { userId: String(user.id) },
    });
    res.json({ url: session.url });
  } catch (e) {
    console.error('[Subscription] Checkout error:', e.message);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// POST /api/subscription/portal
router.post('/portal', requireAuth, async (req, res) => {
  const s = getStripe();
  if (!s) return res.status(503).json({ error: 'Stripe not configured' });
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user.stripeCustomerId) return res.status(400).json({ error: 'No Stripe customer found' });
    const session = await s.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${BASE_URL}/settings`,
    });
    res.json({ url: session.url });
  } catch (e) {
    console.error('[Subscription] Portal error:', e.message);
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

router.webhookHandler = webhookHandler;
module.exports = router;
