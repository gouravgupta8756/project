/**
 * PixelLift — server.js (UPDATED with Razorpay)
 * Replace your existing backend/server.js with this file
 */

require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const rateLimit = require('express-rate-limit');

const enhanceRoute  = require('./routes/enhance');
const removeBgRoute = require('./routes/removeBg');
const paymentRoute  = require('./routes/payment');   // NEW

const app  = express();
const PORT = process.env.PORT || 3001;

// ── CORS ───────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5500',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5500',
  'http://127.0.0.1:3000',
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) cb(null, true);
    else cb(new Error('CORS: Origin not allowed'));
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

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
app.use('/api/payment',   paymentRoute);   // NEW

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

app.listen(PORT, () => {
  console.log(`\n✦ PixelLift backend running on http://localhost:${PORT}`);
  console.log(`  Razorpay: ${process.env.RAZORPAY_KEY_ID ? '✅ configured' : '⚠️  add RAZORPAY_KEY_ID to .env'}`);
  console.log(`  Health: http://localhost:${PORT}/api/health\n`);
});
