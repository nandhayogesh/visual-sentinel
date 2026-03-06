'use strict';

/**
 * URLScan.io integration
 * Docs: https://urlscan.io/docs/api/
 *
 * Flow:
 *   1. POST /api/v1/scan/ → { uuid }
 *   2. Poll GET /api/v1/result/{uuid}/ every 3s (up to 15 retries)
 *   3. Extract: malicious, score, categories, IP, country, ASN, screenshot URL, tlsMismatch
 */

const axios = require('axios');

const BASE = 'https://urlscan.io/api/v1';
const POLL_INTERVAL_MS = 3000;
const MAX_RETRIES = 15;

async function scan(url) {
  const apiKey = process.env.URLSCAN_API_KEY;
  if (!apiKey) {
    return { error: 'URLSCAN_API_KEY not configured', malicious: false, score: 0, categories: [], ip: null, country: null, asnName: null };
  }

  let uuid;
  try {
    const submitRes = await axios.post(
      `${BASE}/scan/`,
      { url, visibility: 'unlisted' },
      { headers: { 'API-Key': apiKey, 'Content-Type': 'application/json' }, timeout: 15000 }
    );
    uuid = submitRes.data.uuid;
  } catch (err) {
    const msg = err.response?.data?.message || err.message;
    return { error: `URLScan submit failed: ${msg}`, malicious: false, score: 0, categories: [], ip: null, country: null, asnName: null };
  }

  // Poll for result
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    await sleep(POLL_INTERVAL_MS);
    try {
      const resultRes = await axios.get(`${BASE}/result/${uuid}/`, { timeout: 10000 });
      const data = resultRes.data;

      const overall = data.verdicts?.overall ?? {};
      const page = data.page ?? {};
      const screenshotURL = `https://urlscan.io/screenshots/${uuid}.png`;

      return {
        malicious: overall.malicious ?? false,
        score: overall.score ?? 0,
        categories: overall.categories ?? [],
        ip: page.ip ?? null,
        country: page.country ?? null,
        asnName: page.asnname ?? null,
        screenshotURL,
        tlsMismatch: data.stats?.tlsMismatch ?? false,
      };
    } catch (err) {
      if (err.response?.status === 404) {
        // Result not ready yet — keep polling
        continue;
      }
      return { error: `URLScan result fetch failed: ${err.message}`, malicious: false, score: 0, categories: [], ip: null, country: null, asnName: null };
    }
  }

  return { error: 'URLScan timed out waiting for result', malicious: false, score: 0, categories: [], ip: null, country: null, asnName: null };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { scan };
