'use strict';

/**
 * VirusTotal v3 API integration
 * Docs: https://developers.virustotal.com/reference/scan-url
 *
 * Flow:
 *   1. POST /api/v3/urls → { data: { id } }  (id is base64url-encoded URL)
 *   2. Poll GET /api/v3/analyses/{id} every 3s (up to 10 retries) until status === 'completed'
 *   3. Extract stats: malicious, suspicious, harmless, undetected, total engines
 */

const axios = require('axios');

const BASE = 'https://www.virustotal.com/api/v3';
const POLL_INTERVAL_MS = 3000;
const MAX_RETRIES = 10;

async function submitAndAnalyze(url) {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;
  if (!apiKey) {
    return { error: 'VIRUSTOTAL_API_KEY not configured', maliciousCount: 0, suspiciousCount: 0, harmlessCount: 0, undetectedCount: 0, totalEngines: 0, detected: false };
  }

  let analysisId;
  try {
    // VirusTotal expects application/x-www-form-urlencoded
    const params = new URLSearchParams();
    params.append('url', url);

    const submitRes = await axios.post(`${BASE}/urls`, params.toString(), {
      headers: { 'x-apikey': apiKey, 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 15000,
    });
    analysisId = submitRes.data?.data?.id;
  } catch (err) {
    const msg = err.response?.data?.error?.message || err.message;
    return { error: `VirusTotal submit failed: ${msg}`, maliciousCount: 0, suspiciousCount: 0, harmlessCount: 0, undetectedCount: 0, totalEngines: 0, detected: false };
  }

  if (!analysisId) {
    return { error: 'VirusTotal returned no analysis ID', maliciousCount: 0, suspiciousCount: 0, harmlessCount: 0, undetectedCount: 0, totalEngines: 0, detected: false };
  }

  // Poll for completed analysis
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    await sleep(POLL_INTERVAL_MS);
    try {
      const analysisRes = await axios.get(`${BASE}/analyses/${analysisId}`, {
        headers: { 'x-apikey': apiKey },
        timeout: 10000,
      });

      const attrs = analysisRes.data?.data?.attributes ?? {};
      if (attrs.status !== 'completed') continue;

      const stats = attrs.stats ?? {};
      const maliciousCount = stats.malicious ?? 0;
      const suspiciousCount = stats.suspicious ?? 0;
      const harmlessCount = stats.harmless ?? 0;
      const undetectedCount = stats.undetected ?? 0;
      const totalEngines = maliciousCount + suspiciousCount + harmlessCount + undetectedCount;

      // Build permalink using base64url of the URL
      const permalink = `https://www.virustotal.com/gui/url/${Buffer.from(url).toString('base64url')}/detection`;

      return {
        maliciousCount,
        suspiciousCount,
        harmlessCount,
        undetectedCount,
        totalEngines,
        detected: maliciousCount > 0,
        permalink,
      };
    } catch (err) {
      return { error: `VirusTotal analysis fetch failed: ${err.message}`, maliciousCount: 0, suspiciousCount: 0, harmlessCount: 0, undetectedCount: 0, totalEngines: 0, detected: false };
    }
  }

  return { error: 'VirusTotal timed out waiting for analysis', maliciousCount: 0, suspiciousCount: 0, harmlessCount: 0, undetectedCount: 0, totalEngines: 0, detected: false };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = { submitAndAnalyze };
