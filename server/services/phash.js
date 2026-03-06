'use strict';

/**
 * Perceptual hash (Average Hash / aHash) implementation.
 * Produces a 64-character binary string (each char '0' or '1'),
 * which matches exactly what HashComparison.tsx renders in its 8×8 grid.
 *
 * Algorithm:
 *   1. Download image from URL
 *   2. Resize to 8×8 pixels, convert to grayscale
 *   3. Compute mean brightness of all 64 pixels
 *   4. Each pixel >= mean → '1', else → '0'
 *   5. Concatenate → 64-char binary string
 */

const axios = require('axios');
const sharp = require('sharp');

/**
 * Compute average hash for an image at the given URL.
 * Returns a 64-char binary string, or throws on error.
 */
async function hashFromUrl(imageUrl) {
  const res = await axios.get(imageUrl, {
    responseType: 'arraybuffer',
    timeout: 15000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; visual-sentinel/1.0)',
    },
  });

  const pixels = await sharp(Buffer.from(res.data))
    .resize(8, 8, { fit: 'fill' })
    .greyscale()
    .raw()
    .toBuffer();

  const arr = Array.from(pixels); // 64 grayscale values (0–255)
  const mean = arr.reduce((sum, p) => sum + p, 0) / arr.length;

  return arr.map(p => (p >= mean ? '1' : '0')).join('');
}

/**
 * Hamming distance between two 64-char binary hash strings.
 * Returns a number 0–64 (0 = identical, 64 = completely different).
 */
function hammingDistance(hash1, hash2) {
  if (!hash1 || !hash2 || hash1.length !== 64 || hash2.length !== 64) return 64;
  let distance = 0;
  for (let i = 0; i < 64; i++) {
    if (hash1[i] !== hash2[i]) distance++;
  }
  return distance;
}

module.exports = { hashFromUrl, hammingDistance };
