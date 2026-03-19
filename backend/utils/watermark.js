/**
 * Watermark utility
 * Adds a subtle text watermark to processed images (free tier)
 *
 * Uses sharp's SVG overlay feature — no external API needed.
 */
const sharp = require('sharp');

/**
 * Adds a "PixelLift Free" watermark to an image buffer.
 * @param {Buffer} inputBuffer - Image buffer
 * @returns {Promise<Buffer>} - Watermarked image buffer
 */
async function addWatermark(inputBuffer) {
  const image   = sharp(inputBuffer);
  const meta    = await image.metadata();
  const { width = 800, height = 600 } = meta;

  // SVG watermark text, bottom-right corner
  const watermarkSvg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .wm {
          font-family: Arial, sans-serif;
          font-size: ${Math.max(18, Math.round(width * 0.025))}px;
          fill: white;
          fill-opacity: 0.65;
          font-weight: bold;
        }
      </style>
      <text
        x="${width - 16}"
        y="${height - 16}"
        text-anchor="end"
        class="wm"
      >✦ PixelLift Free</text>
    </svg>`;

  const watermarkBuffer = Buffer.from(watermarkSvg);

  return sharp(inputBuffer)
    .composite([{ input: watermarkBuffer, top: 0, left: 0 }])
    .png()
    .toBuffer();
}

module.exports = { addWatermark };
