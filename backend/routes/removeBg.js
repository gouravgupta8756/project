/**
 * POST /api/remove-bg
 *
 * Removes the background from an uploaded image.
 *
 * Primary: remove.bg API (https://www.remove.bg/api)
 *   - Free tier: 50 HD calls/month
 *   - Sign up at remove.bg → API → Get API Key
 *
 * Fallback (if no API key): returns a demo "processed" image
 * so the app remains testable without an API key.
 */

const express  = require('express');
const router   = express.Router();
const axios    = require('axios');
const FormData = require('form-data');
const sharp    = require('sharp');
const upload   = require('../middleware/upload');
const { addWatermark } = require('../utils/watermark');

router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided.' });
    }

    const apiKey = process.env.REMOVE_BG_API_KEY;

    // ── If no API key: return demo mode ──────────────────
    if (!apiKey || apiKey === 'your_remove_bg_api_key_here') {
      console.warn('[/api/remove-bg] No API key — returning demo result.');
      return res.status(402).json({
        message: 'Background removal requires a remove.bg API key. ' +
                 'Add REMOVE_BG_API_KEY to your .env file. ' +
                 'Free tier: 50 calls/month at remove.bg'
      });
    }

    // ── Call remove.bg API ────────────────────────────────
    const formData = new FormData();
    formData.append('image_file', req.file.buffer, {
      filename:    req.file.originalname || 'image.png',
      contentType: req.file.mimetype,
    });
    formData.append('size', 'auto'); // auto = best quality available

    const response = await axios.post(
      'https://api.remove.bg/v1.0/removebg',
      formData,
      {
        headers: {
          'X-Api-Key': apiKey,
          ...formData.getHeaders(),
        },
        responseType: 'arraybuffer', // receive binary image data
        timeout: 30000,              // 30 second timeout
      }
    );

    // response.data is the PNG buffer with background removed
    let resultBuffer = Buffer.from(response.data);

    // ── Watermark (free tier) ────────────────────────────
    if (process.env.ADD_WATERMARK !== 'false') {
      resultBuffer = await addWatermark(resultBuffer);
    }

    // ── Send result ──────────────────────────────────────
    res.set({
      'Content-Type':        'image/png',
      'Content-Disposition': 'inline; filename="no-background.png"',
      'Cache-Control':       'no-store',
    });
    res.send(resultBuffer);

  } catch (error) {
    // Handle remove.bg specific errors
    if (error.response) {
      const status = error.response.status;
      if (status === 402) {
        return res.status(402).json({ message: 'remove.bg API credits exhausted. Please upgrade your plan.' });
      }
      if (status === 403) {
        return res.status(403).json({ message: 'remove.bg API key is invalid. Check your REMOVE_BG_API_KEY.' });
      }
      if (status === 429) {
        return res.status(429).json({ message: 'remove.bg rate limit reached. Please wait and try again.' });
      }
    }
    console.error('[/api/remove-bg] Error:', error.message);
    res.status(500).json({ message: 'Background removal failed: ' + error.message });
  }
});

module.exports = router;
