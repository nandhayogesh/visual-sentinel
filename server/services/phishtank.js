'use strict';

/**
 * PhishTank checkurl API integration
 * Docs: https://www.phishtank.com/api_info.php
 *
 * Single POST call — checks if URL is in the PhishTank phishing database.
 * Requires a free app_key obtained by registering at phishtank.com.
 */

const axios = require('axios');

const ENDPOINT = 'https://checkurl.phishtank.com/checkurl/';

async function check(url) {
  const appKey = process.env.PHISHTANK_APP_KEY;
  if (!appKey) {
    return { error: 'PHISHTANK_APP_KEY not configured', inDatabase: false, isPhish: false, verified: false };
  }

  try {
    const params = new URLSearchParams();
    params.append('url', url);
    params.append('format', 'json');
    params.append('app_key', appKey);

    const res = await axios.post(ENDPOINT, params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'phishtank/visual-sentinel' },
      timeout: 10000,
    });

    const results = res.data?.results;
    if (!results) {
      return { error: 'PhishTank returned unexpected response format', inDatabase: false, isPhish: false, verified: false };
    }

    return {
      inDatabase: results.in_database === true,
      isPhish: results.in_database === true && results.valid === true,
      verified: results.verified === true,
      phishId: results.phish_id ? String(results.phish_id) : null,
      phishDetailUrl: results.phish_detail_page ?? null,
    };
  } catch (err) {
    const msg = err.response?.data?.errortext || err.message;
    return { error: `PhishTank check failed: ${msg}`, inDatabase: false, isPhish: false, verified: false };
  }
}

module.exports = { check };
