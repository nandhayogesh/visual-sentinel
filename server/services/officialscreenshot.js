'use strict';

/**
 * Official brand screenshot lookup via URLScan.io search API.
 *
 * Uses the URLScan search endpoint to find the most recent public scan
 * of the official brand domain, then returns its screenshot URL.
 * Reuses the existing URLSCAN_API_KEY — no additional keys needed.
 *
 * Docs: https://urlscan.io/docs/search/
 */

const axios = require('axios');

const SEARCH_BASE = 'https://urlscan.io/api/v1/search/';

/**
 * Return the screenshot URL of the latest URLScan.io scan for the given domain.
 * Returns null if not found or on error.
 */
async function getOfficialScreenshot(officialDomain) {
  const apiKey = process.env.URLSCAN_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await axios.get(SEARCH_BASE, {
      params: {
        q: `domain:${officialDomain} AND page.status:200`,
        size: 1,
        sort: 'date',
      },
      headers: { 'API-Key': apiKey },
      timeout: 10000,
    });

    const results = res.data?.results;
    if (!results || results.length === 0) return null;

    const uuid = results[0]?.task?.uuid;
    if (!uuid) return null;

    return `https://urlscan.io/screenshots/${uuid}.png`;
  } catch (_err) {
    return null;
  }
}

module.exports = { getOfficialScreenshot };
