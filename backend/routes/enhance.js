/**
 * POST /api/enhance
 *
 * Enhances an uploaded image using the `sharp` library (100% free, runs locally).
 * Applies: sharpness, brightness boost, saturation, and clarity.
 *
 * For true AI upscaling (optional), you can swap this out with:
 *   - DeepAI Image Colorizer / Super Resolution API
 *   - Replicate.com (ESRGAN model, free credits)
 *   - Stability AI
 *
 * The sharp-only approach works great for clarity, sharpness, and quality.
 */

const express  = require('express');
const router   = express.Router();
const sharp    = require('sharp');
const upload   = require('../middleware/upload');
const { addWatermark } = require('../utils/watermark');

router.post('/', upload.single('image'), async (req, res) => {
  try {
    // Check that a file was received
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided.' });
    }

    const inputBuffer = req.file.buffer;

    // Get original dimensions first
    const meta = await sharp(inputBuffer).metadata();
    const newWidth  = Math.round(meta.width  * 1.5);
    const newHeight = Math.round(meta.height * 1.5);

    // ── Enhancement Pipeline (gentle, natural settings) ───
    // Step 1: Upscale with high-quality Lanczos resampling
    // Step 2: Mild sharpen — just enough to restore softness from upscaling
    // Step 3: Slight brightness + saturation lift
    // Step 4: Gentle gamma correction for better perceived clarity
    let enhancedBuffer = await sharp(inputBuffer)
      // Upscale 1.5x — do this FIRST before sharpening
      .resize({
        width:  newWidth,
        height: newHeight,
        fit: 'fill',
        kernel: sharp.kernel.lanczos3,
      })
      // Very mild sharpen — sigma 0.6 is subtle, not destructive
      .sharpen({ sigma: 0.6, m1: 0.5, m2: 0.5 })
      // 3% brighter, 10% more vivid — barely noticeable but nice
      .modulate({ brightness: 1.03, saturation: 1.1 })
      // Gentle gamma tweak — lifts midtones slightly (clarity feel)
      .gamma(1.1)
      .png({ quality: 90, compressionLevel: 6 })
      .toBuffer();

    // ── Watermark (free tier) ─────────────────────────────
    if (process.env.ADD_WATERMARK !== 'false') {
      enhancedBuffer = await addWatermark(enhancedBuffer);
    }

    // ── Send response ─────────────────────────────────────
    res.set({
      'Content-Type':        'image/png',
      'Content-Disposition': 'inline; filename="enhanced.png"',
      'Cache-Control':       'no-store',
    });
    res.send(enhancedBuffer);

  } catch (error) {
    console.error('[/api/enhance] Error:', error.message);
    res.status(500).json({ message: 'Image enhancement failed: ' + error.message });
  }
});

module.exports = router;