'use strict';

/**
 * OpenPhish free feed integration
 * Docs: https://openphish.com/
 *
 * No API key required. Downloads the public phishing URL feed (~30k entries)
 * and checks submitted URLs against it. Feed is refreshed every 12 hours.
 *
 * Matching strategy:
 *   1. Exact URL match (normalized: lowercase, trailing slash stripped)
 *   2. Domain match  (any feed entry shares the same registered domain)
 */

const axios = require('axios');

const FEED_URL       = 'https://openphish.com/feed.txt';
const REFRESH_MS     = 12 * 60 * 60 * 1000; // 12 hours

let urlSet    = new Set(); // normalized full URLs from the feed
let domainSet = new Set(); // hostnames extracted from feed entries
let lastFetch = 0;
let feedReady = false;

function normalizeUrl(raw) {
  try {
    const u = new URL(raw.trim().toLowerCase());
    // Strip trailing slash from pathname for consistent comparison
    u.pathname = u.pathname.replace(/\/+$/, '') || '/';
    return u.href;
  } catch {
    return raw.trim().toLowerCase();
  }
}

function extractDomain(raw) {
  try {
    return new URL(raw.trim()).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

async function refreshFeed() {
  try {
    const res = await axios.get(FEED_URL, {
      timeout: 20000,
      responseType: 'text',
      headers: { 'User-Agent': 'visual-sentinel/1.0' },
    });

    const lines = res.data.split('\n').map(l => l.trim()).filter(Boolean);

    const newUrls    = new Set();
    const newDomains = new Set();

    for (const line of lines) {
      newUrls.add(normalizeUrl(line));
      const d = extractDomain(line);
      if (d) newDomains.add(d);
    }

    urlSet    = newUrls;
    domainSet = newDomains;
    lastFetch = Date.now();
    feedReady = true;

    console.log(`[openphish] Feed refreshed — ${newUrls.size} URLs, ${newDomains.size} domains`);
  } catch (err) {
    console.warn('[openphish] Feed refresh failed:', err.message);
  }
}

// Load feed immediately on startup, then refresh every 12h
refreshFeed();
setInterval(refreshFeed, REFRESH_MS);

/**
 * Check whether a URL appears in the OpenPhish phishing feed.
 * Returns: { inFeed, matchType, error? }
 */
async function check(url) {
  if (!feedReady) {
    return { inFeed: false, matchType: null, error: 'OpenPhish feed not yet loaded' };
  }

  try {
    const normalized = normalizeUrl(url);
    const domain     = extractDomain(url);

    if (urlSet.has(normalized)) {
      return { inFeed: true, matchType: 'exact' };
    }

    if (domain && domainSet.has(domain)) {
      return { inFeed: true, matchType: 'domain' };
    }

    return { inFeed: false, matchType: null };
  } catch (err) {
    return { inFeed: false, matchType: null, error: `OpenPhish check failed: ${err.message}` };
  }
}

module.exports = { check };
