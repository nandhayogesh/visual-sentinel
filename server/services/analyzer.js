'use strict';

/**
 * Analysis orchestrator.
 * Coordinates all service calls, reports incremental progress via the
 * job store, and assembles the final AnalysisResult payload.
 */

const { updateJob, setJobComplete, setJobError, emitJobEvent } = require('../jobs');
const urlscanSvc          = require('./urlscan');
const virustotalSvc       = require('./virustotal');
const safebrowsingSvc     = require('./safebrowsing');
const openphishSvc        = require('./openphish');
const sslSvc              = require('./ssl');
const whoisSvc            = require('./whois');
const dnsSvc              = require('./dns');
const headersSvc          = require('./headers');
const geoSvc              = require('./geo');
const { hashFromUrl, hammingDistance } = require('./phash');
const { getOfficialScreenshot }        = require('./officialscreenshot');
const { detectBrand, computeVerdict }  = require('./scoring');

function parseDomain(rawUrl) {
  try {
    let u = rawUrl.trim();
    if (!u.startsWith('http://') && !u.startsWith('https://')) u = 'https://' + u;
    return new URL(u).hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return rawUrl.toLowerCase().split('/')[0].replace(/^www\./, '');
  }
}

function normalizeUrl(rawUrl) {
  let u = rawUrl.trim();
  if (!u.startsWith('http://') && !u.startsWith('https://')) u = 'https://' + u;
  return u;
}

function withTimeout(promise, timeoutMs, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
    }),
  ]);
}

async function runAnalysis(jobId, rawUrl) {
  const url = normalizeUrl(rawUrl);
  const domain = parseDomain(rawUrl);
  const partialChecks = {};
  let currentProgress = 0;

  const pushProgress = (nextProgress, stage, extra = {}) => {
    currentProgress = Math.max(currentProgress, nextProgress);
    updateJob(jobId, {
      progress: currentProgress,
      stage,
      ...extra,
    });
  };

  const recordCheck = (checkName, value, nextProgress, stage, status = 'fulfilled') => {
    partialChecks[checkName] = value;
    pushProgress(nextProgress, stage, {
      partialChecks: { ...partialChecks },
      completedCheck: { name: checkName, status },
    });

    emitJobEvent(jobId, 'progress', {
      progress: currentProgress,
      stage,
      checkName,
      check: value,
      partialChecks: { ...partialChecks },
      completedChecks: Object.keys(partialChecks).length,
      totalChecks: 8,
      status,
    });
  };

  const trackCheck = (checkName, promise, fallbackValue, timeoutMs = 20000) => {
    return withTimeout(promise, timeoutMs, checkName).then(
      value => {
        const completedCount = Object.keys(partialChecks).length + 1;
        const nextProgress = 10 + Math.round((completedCount / 8) * 35);
        recordCheck(checkName, value, nextProgress, `${checkName} check complete.`);
        return value;
      },
      reason => {
        const completedCount = Object.keys(partialChecks).length + 1;
        const nextProgress = 10 + Math.round((completedCount / 8) * 35);
        const errorMessage = reason?.message ?? String(reason);
        const value = fallbackValue(errorMessage);
        recordCheck(checkName, value, nextProgress, `${checkName} check complete.`, 'rejected');
        return value;
      }
    );
  };

  try {
    // ── Stage 1: Brand detection (instant, local) ─────────────────────────
    pushProgress(5, 'Identifying brand…');
    const brand = detectBrand(domain);

    // ── Stage 2: Fast parallel checks ─────────────────────────────────────
    // SSL, WHOIS, DNS, headers, Safe Browsing, OpenPhish, and VirusTotal
    // all run concurrently. VirusTotal includes its own polling internally.
    pushProgress(10, 'Running protocol checks…');

    const sslPromise = trackCheck('ssl', sslSvc.checkSSL(domain), error => ({ error, valid: false, daysRemaining: 0, issuer: 'Unknown', domainMatch: false }), 20000);
    const whoisPromise = trackCheck('whois', whoisSvc.lookupWhois(domain), error => ({ error, creationDate: null, domainAge: null, registrar: null, registrantCountry: null }), 20000);
    const dnsPromise = trackCheck('dns', dnsSvc.lookupDNS(domain), error => ({ error, hasARecord: false, ipAddresses: [], hasMXRecord: false, mxRecords: [], nameservers: [], isCloudflareProxy: false }), 20000);
    const headersPromise = trackCheck('headers', headersSvc.checkHeaders(url), error => ({ error, hasHSTS: false, hasCSP: false, hasXFrameOptions: false, hasXContentTypeOptions: false, hasReferrerPolicy: false, statusCode: null, finalUrl: url, redirectChain: [], redirectCount: 0, server: null }), 20000);
    const safebrowsingPromise = trackCheck('safebrowsing', safebrowsingSvc.check(url), error => ({ error, isFlagged: false, threatType: null }), 15000);
    const openphishPromise = trackCheck('openphish', openphishSvc.check(url), error => ({ error, inFeed: false, matchType: null }), 12000);
    const virustotalPromise = trackCheck('virustotal', virustotalSvc.submitAndAnalyze(url, progressInfo => {
      const nextProgress = typeof progressInfo?.progress === 'number' ? progressInfo.progress : currentProgress;
      const stage = progressInfo?.stage ?? 'VirusTotal polling…';
      pushProgress(nextProgress, stage, { completedCheck: { name: 'virustotal', status: 'running' } });
      emitJobEvent(jobId, 'progress', {
        progress: currentProgress,
        stage,
        checkName: 'virustotal',
        checkProgress: progressInfo,
      });
    }), error => ({ error, maliciousCount: 0, suspiciousCount: 0, harmlessCount: 0, undetectedCount: 0, totalEngines: 0, detected: false }), 70000);
    const urlscanPromise = trackCheck('urlscan', urlscanSvc.scan(url, progressInfo => {
      const nextProgress = typeof progressInfo?.progress === 'number' ? progressInfo.progress : currentProgress;
      const stage = progressInfo?.stage ?? 'URLScan polling…';
      pushProgress(nextProgress, stage, { completedCheck: { name: 'urlscan', status: 'running' } });
      emitJobEvent(jobId, 'progress', {
        progress: currentProgress,
        stage,
        checkName: 'urlscan',
        checkProgress: progressInfo,
      });
    }), error => ({ error, malicious: false, score: 0, categories: [], ip: null, country: null, asnName: null }), 70000);

    const [ssl, whois, dns, headers, safebrowsing, openphish, virustotal, urlscan] = await Promise.all([
      sslPromise,
      whoisPromise,
      dnsPromise,
      headersPromise,
      safebrowsingPromise,
      openphishPromise,
      virustotalPromise,
      urlscanPromise,
    ]);

    pushProgress(45, 'Checking OpenPhish feed…');

    // ── Stage 3: URLScan — submit + poll (slowest, ~15–45s) ───────────────
    pushProgress(55, 'Capturing screenshot via URLScan…');

    // ── Stage 4: Official screenshot + pHash (only when brand impersonation detected) ──
    const screenshots = {
      suspicious: urlscan.screenshotURL ?? null,
      official: null,
    };
    let visualHash = null;

    if (brand.detected && urlscan.screenshotURL) {
      pushProgress(80, 'Fetching official site screenshot…');
      const officialUrl = await getOfficialScreenshot(brand.officialUrl).catch(() => null);

      if (officialUrl) {
        screenshots.official = officialUrl;

        pushProgress(87, 'Computing visual hash comparison…');
        const [suspHash, offHash] = await Promise.all([
          hashFromUrl(urlscan.screenshotURL).catch(() => null),
          hashFromUrl(officialUrl).catch(() => null),
        ]);

        if (suspHash && offHash) {
          const dist = hammingDistance(suspHash, offHash);
          visualHash = {
            suspiciousHash: suspHash,
            officialHash:   offHash,
            hammingDistance: dist,
            similarityPercent: Math.round((1 - dist / 64) * 100),
          };
        }
      }
    }

    // ── Stage 5: GeoIP ────────────────────────────────────────────────────
    pushProgress(92, 'Resolving IP geolocation…');
    const primaryIp = dns.ipAddresses?.[0] ?? urlscan.ip ?? null;
    const geo = geoSvc.lookupGeo(primaryIp, urlscan);
    recordCheck('geo', geo, 92, 'GeoIP lookup complete.');

    // ── Stage 6: Score + verdict ──────────────────────────────────────────
    pushProgress(96, 'Computing final verdict…');
    const verdict = computeVerdict({
      ssl, whois, dns, headers,
      virustotal, safebrowsing, openphish,
      urlscan, brand, visualHash,
    });

    // ── Assemble final result ─────────────────────────────────────────────
    const result = {
      jobId,
      status: 'complete',
      url,
      domain,
      brand,
      verdict,
      screenshots,
      visualHash,
      riskFactors: verdict.riskFactors,
      checks: {
        ssl,
        whois,
        dns,
        headers,
        virustotal,
        openphish,
        safebrowsing,
        urlscan: {
          malicious:  urlscan.malicious  ?? false,
          score:      urlscan.score      ?? 0,
          categories: urlscan.categories ?? [],
          ip:         urlscan.ip         ?? null,
          country:    urlscan.country    ?? null,
          asnName:    urlscan.asnName    ?? null,
          tlsMismatch: urlscan.tlsMismatch ?? false,
          ...(urlscan.error ? { error: urlscan.error } : {}),
        },
        geo,
      },
    };

    setJobComplete(jobId, result);
  } catch (err) {
    console.error(`[analyzer] Fatal error for job ${jobId}:`, err);
    setJobError(jobId, err.message ?? 'An unexpected error occurred during analysis.');
  }
}

module.exports = { runAnalysis };
