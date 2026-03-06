'use strict';

/**
 * Analysis orchestrator.
 * Coordinates all service calls, reports incremental progress via the
 * job store, and assembles the final AnalysisResult payload.
 */

const { updateJob, setJobComplete, setJobError } = require('../jobs');
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

async function runAnalysis(jobId, rawUrl) {
  const url = normalizeUrl(rawUrl);
  const domain = parseDomain(rawUrl);

  try {
    // ── Stage 1: Brand detection (instant, local) ─────────────────────────
    updateJob(jobId, { progress: 5, stage: 'Identifying brand…' });
    const brand = detectBrand(domain);

    // ── Stage 2: Fast parallel checks ─────────────────────────────────────
    // SSL, WHOIS, DNS, headers, Safe Browsing, OpenPhish, and VirusTotal
    // all run concurrently. VirusTotal includes its own polling internally.
    updateJob(jobId, { progress: 10, stage: 'Running protocol checks…' });

    const [sslRes, whoisRes, dnsRes, headersRes, sbRes, opRes, vtRes] =
      await Promise.allSettled([
        sslSvc.checkSSL(domain),
        whoisSvc.lookupWhois(domain),
        dnsSvc.lookupDNS(domain),
        headersSvc.checkHeaders(url),
        safebrowsingSvc.check(url),
        openphishSvc.check(url),
        virustotalSvc.submitAndAnalyze(url),
      ]);

    updateJob(jobId, { progress: 45, stage: 'Checking OpenPhish feed…' });
    const ssl         = sslRes.status === 'fulfilled'     ? sslRes.value     : { error: sslRes.reason?.message,     valid: false, daysRemaining: 0, issuer: 'Unknown', domainMatch: false };
    const whois       = whoisRes.status === 'fulfilled'   ? whoisRes.value   : { error: whoisRes.reason?.message,   creationDate: null, domainAge: null, registrar: null, registrantCountry: null };
    const dns         = dnsRes.status === 'fulfilled'     ? dnsRes.value     : { error: dnsRes.reason?.message,     hasARecord: false, ipAddresses: [], hasMXRecord: false, mxRecords: [], nameservers: [], isCloudflareProxy: false };
    const headers     = headersRes.status === 'fulfilled' ? headersRes.value : { error: headersRes.reason?.message, hasHSTS: false, hasCSP: false, hasXFrameOptions: false, hasXContentTypeOptions: false, hasReferrerPolicy: false, statusCode: null, finalUrl: url, redirectChain: [], redirectCount: 0, server: null };
    const safebrowsing = sbRes.status === 'fulfilled'     ? sbRes.value     : { error: sbRes.reason?.message,       isFlagged: false, threatType: null };
    const openphish   = opRes.status === 'fulfilled'      ? opRes.value     : { error: opRes.reason?.message,       inFeed: false, matchType: null };
    const virustotal  = vtRes.status === 'fulfilled'      ? vtRes.value     : { error: vtRes.reason?.message,       maliciousCount: 0, suspiciousCount: 0, harmlessCount: 0, undetectedCount: 0, totalEngines: 0, detected: false };

    // ── Stage 3: URLScan — submit + poll (slowest, ~15–45s) ───────────────
    updateJob(jobId, { progress: 55, stage: 'Capturing screenshot via URLScan…' });
    const urlscan = await urlscanSvc.scan(url);

    // ── Stage 4: Official screenshot + pHash (only when brand impersonation detected) ──
    const screenshots = {
      suspicious: urlscan.screenshotURL ?? null,
      official: null,
    };
    let visualHash = null;

    if (brand.detected && urlscan.screenshotURL) {
      updateJob(jobId, { progress: 80, stage: 'Fetching official site screenshot…' });
      const officialUrl = await getOfficialScreenshot(brand.officialUrl).catch(() => null);

      if (officialUrl) {
        screenshots.official = officialUrl;

        updateJob(jobId, { progress: 87, stage: 'Computing visual hash comparison…' });
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
    updateJob(jobId, { progress: 92, stage: 'Resolving IP geolocation…' });
    const primaryIp = dns.ipAddresses?.[0] ?? urlscan.ip ?? null;
    const geo = geoSvc.lookupGeo(primaryIp, urlscan);

    // ── Stage 6: Score + verdict ──────────────────────────────────────────
    updateJob(jobId, { progress: 96, stage: 'Computing final verdict…' });
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
