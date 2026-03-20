/**
 * POST /api/enhance
 *
 * Optimized for Render free plan (fast processing, no timeout)
 */

const express  = require('express');
const router   = express.Router();
const sharp    = require('sharp');
const upload   = require('../middleware/upload');
const { addWatermark } = require('../utils/watermark');

router.post('/', upload.single('image'), async (req, res) => {
  try {
    // ── Validate ──────────────────────────────────────────
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided.' });
    }

    const inputBuffer = req.file.buffer;

    // ── Resize limit (VERY IMPORTANT for speed) ───────────
    const meta = await sharp(inputBuffer).metadata();

    // Max width limit (prevents heavy processing)
    const MAX_WIDTH = 1200;

    let width = meta.width;
    let height = meta.height;

    if (width > MAX_WIDTH) {
      const ratio = MAX_WIDTH / width;
      width  = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    // ── Enhancement (FAST + SAFE) ─────────────────────────
    let enhancedBuffer = await sharp(inputBuffer)
      .resize({
        width,
        height,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .sharpen(0.5) // lighter sharpen = faster
      .modulate({
        brightness: 1.02,
        saturation: 1.05,
      })
      .jpeg({
        quality: 85, // faster than PNG
      })
      .toBuffer();

    // ── Watermark (optional) ──────────────────────────────
    if (process.env.ADD_WATERMARK !== 'false') {
      enhancedBuffer = await addWatermark(enhancedBuffer);
    }

    // ── Response ──────────────────────────────────────────
    res.set({
      'Content-Type':        'image/jpeg',
      'Content-Disposition': 'inline; filename="enhanced.jpg"',
      'Cache-Control':       'no-store',
    });

    res.send(enhancedBuffer);

  } catch (error) {
    console.error('[/api/enhance] Error:', error.message);
    res.status(500).json({
      message: 'Image enhancement failed: ' + error.message
    });
  }
});

module.exports = router;