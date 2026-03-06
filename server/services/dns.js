'use strict';

/**
 * DNS resolution using Node.js built-in dns/promises module.
 * Resolves A records, MX records, and NS records for the hostname.
 */

const dns = require('dns').promises;

async function lookupDNS(hostname) {
  const [aResult, mxResult, nsResult] = await Promise.allSettled([
    dns.resolve4(hostname),
    dns.resolveMx(hostname),
    dns.resolveNs(hostname),
  ]);

  const ipAddresses = aResult.status === 'fulfilled' ? aResult.value : [];
  const mxRecords = mxResult.status === 'fulfilled'
    ? mxResult.value.map(r => r.exchange)
    : [];
  const nameservers = nsResult.status === 'fulfilled' ? nsResult.value : [];

  const hasARecord = ipAddresses.length > 0;
  const hasMXRecord = mxRecords.length > 0;
  const isCloudflareProxy = nameservers.some(ns => ns.toLowerCase().includes('cloudflare'));

  const error = !hasARecord && aResult.status === 'rejected'
    ? `DNS resolution failed: ${aResult.reason?.message}`
    : undefined;

  return {
    hasARecord,
    ipAddresses,
    hasMXRecord,
    mxRecords,
    nameservers,
    isCloudflareProxy,
    ...(error ? { error } : {}),
  };
}

module.exports = { lookupDNS };
