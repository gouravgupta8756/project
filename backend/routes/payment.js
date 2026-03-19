/**
 * PixelLift — Payment Route (Razorpay)
 * File: backend/routes/payment.js
 *
 * Routes:
 *   POST /api/payment/create-order   — Create Razorpay order
 *   POST /api/payment/verify         — Verify payment signature
 *   GET  /api/payment/status/:email  — Check if user is Pro
 */

const express  = require('express');
const router   = express.Router();
const crypto   = require('crypto');
const Razorpay = require('razorpay');

// In-memory Pro users store
// In production: use a real database (MongoDB, PostgreSQL, etc.)
const proUsers = new Map(); // email -> { expiresAt, orderId, paymentId }

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ── CREATE ORDER ───────────────────────────────────────────
// Frontend calls this to get an order_id before showing payment popup
router.post('/create-order', async (req, res) => {
  try {
    const { email, plan } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email required' });
    }

    // Plan pricing (in paise — 1 INR = 100 paise)
    const plans = {
      monthly: { amount: 10000, description: 'PixelLift Pro — Monthly (₹100/mo)' },
      yearly:  { amount: 150000, description: 'PixelLift Pro — Yearly (₹1500/yr)' },
    };

    const selectedPlan = plans[plan] || plans.monthly;

    const order = await razorpay.orders.create({
      amount:   selectedPlan.amount,
      currency: 'INR',
      receipt:  `pl_${Date.now()}`,
      notes: {
        email,
        plan: plan || 'monthly',
        description: selectedPlan.description,
      },
    });

    console.log(`[Payment] Order created: ${order.id} for ${email}`);

    res.json({
      order_id:   order.id,
      amount:     order.amount,
      currency:   order.currency,
      key_id:     process.env.RAZORPAY_KEY_ID,
      description: selectedPlan.description,
    });

  } catch (error) {
    console.error('[Payment] Create order error:', error.message);
    res.status(500).json({ message: 'Could not create order: ' + error.message });
  }
});

// ── VERIFY PAYMENT ─────────────────────────────────────────
// After user pays, Razorpay sends back signature — we verify it
router.post('/verify', (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, email, plan } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !email) {
      return res.status(400).json({ message: 'Missing payment details' });
    }

    // Verify signature using HMAC SHA256
    const body      = razorpay_order_id + '|' + razorpay_payment_id;
    const expected  = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expected !== razorpay_signature) {
      console.warn(`[Payment] Invalid signature for ${email}`);
      return res.status(400).json({ message: 'Payment verification failed. Invalid signature.' });
    }

    // Payment verified! Upgrade user to Pro
    const durationDays = plan === 'yearly' ? 365 : 30;
    const expiresAt    = Date.now() + (durationDays * 24 * 60 * 60 * 1000);

    proUsers.set(email, {
      expiresAt,
      orderId:   razorpay_order_id,
      paymentId: razorpay_payment_id,
      plan:      plan || 'monthly',
      activatedAt: new Date().toISOString(),
    });

    console.log(`[Payment] ✅ ${email} upgraded to Pro (${plan || 'monthly'}) until ${new Date(expiresAt).toDateString()}`);

    res.json({
      success:   true,
      message:   'Payment verified! You are now Pro.',
      expiresAt: new Date(expiresAt).toISOString(),
      plan:      plan || 'monthly',
    });

  } catch (error) {
    console.error('[Payment] Verify error:', error.message);
    res.status(500).json({ message: 'Verification failed: ' + error.message });
  }
});

// ── CHECK STATUS ───────────────────────────────────────────
// Frontend calls this to check if user is Pro
router.get('/status/:email', (req, res) => {
  const email = decodeURIComponent(req.params.email);
  const user  = proUsers.get(email);

  if (!user || Date.now() > user.expiresAt) {
    // Remove expired entry
    if (user) proUsers.delete(email);
    return res.json({ isPro: false });
  }

  res.json({
    isPro:     true,
    plan:      user.plan,
    expiresAt: new Date(user.expiresAt).toISOString(),
  });
});

module.exports = router;
module.exports.proUsers = proUsers; // export so other routes can check Pro status
