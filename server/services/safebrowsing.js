'use strict';

/**
 * Google Safe Browsing v4 API integration
 * Docs: https://developers.google.com/safe-browsing/v4/lookup-api
 *
 * Single synchronous call — no polling needed.
 * Checks the URL against MALWARE, SOCIAL_ENGINEERING, UNWANTED_SOFTWARE, and
 * POTENTIALLY_HARMFUL_APPLICATION threat lists.
 */

const axios = require('axios');

const ENDPOINT = 'https://safebrowsing.googleapis.com/v4/threatMatches:find';

async function check(url) {
  const apiKey = process.env.SAFEBROWSING_API_KEY;
  if (!apiKey) {
    return { error: 'SAFEBROWSING_API_KEY not configured', isFlagged: false, threatType: null };
  }

  try {
    const res = await axios.post(
      `${ENDPOINT}?key=${apiKey}`,
      {
        client: { clientId: 'visual-sentinel', clientVersion: '1.0.0' },
        threatInfo: {
          threatTypes: [
            'MALWARE',
            'SOCIAL_ENGINEERING',
            'UNWANTED_SOFTWARE',
            'POTENTIALLY_HARMFUL_APPLICATION',
          ],
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: ['URL'],
          threatEntries: [{ url }],
        },
      },
      { headers: { 'Content-Type': 'application/json' }, timeout: 10000 }
    );

    const matches = res.data?.matches;
    if (matches && matches.length > 0) {
      return {
        isFlagged: true,
        threatType: matches[0].threatType ?? null,
        platformType: matches[0].platformType ?? undefined,
      };
    }

    return { isFlagged: false, threatType: null };
  } catch (err) {
    const msg = err.response?.data?.error?.message || err.message;
    return { error: `Safe Browsing check failed: ${msg}`, isFlagged: false, threatType: null };
  }
}

module.exports = { check };
