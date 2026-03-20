/**
 * PixelLift — server.js (FINAL FIXED VERSION)
 */

require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const rateLimit = require('express-rate-limit');

const enhanceRoute  = require('./routes/enhance');
const removeBgRoute = require('./routes/removeBg');
const paymentRoute  = require('./routes/payment');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── CORS (FIXED) ───────────────────────────────────────────
app.use(cors());   // 🔥 FULL OPEN (no blocking)

// ── Rate Limiting ──────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 30,
  message: { message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// ── Body Parsing ───────────────────────────────────────────
app.use(express.json());

// ── Routes ─────────────────────────────────────────────────
app.use('/api/enhance',   enhanceRoute);
app.use('/api/remove-bg', removeBgRoute);
app.use('/api/payment',   paymentRoute);

// ── Health Check ───────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    razorpay: !!process.env.RAZORPAY_KEY_ID ? 'configured' : 'not configured',
  });
});

// ── Error Handler ───────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(500).json({ message: err.message || 'Internal server error' });
});

// ── Start Server ───────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✦ PixelLift backend running on PORT ${PORT}`);
});