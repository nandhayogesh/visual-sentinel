'use strict';

/**
 * SSL certificate check using Node.js built-in tls module.
 * Connects on port 443, reads the peer certificate, and returns
 * validity, expiry, issuer, and domain-match information.
 */

const tls = require('tls');

function checkSSL(hostname) {
  return new Promise((resolve) => {
    const socket = tls.connect(
      { host: hostname, port: 443, servername: hostname, rejectUnauthorized: false },
      () => {
        try {
          const cert = socket.getPeerCertificate(false);
          socket.destroy();

          if (!cert || !cert.subject) {
            return resolve({ valid: false, daysRemaining: 0, issuer: 'Unknown', domainMatch: false, error: 'No certificate returned' });
          }

          const validTo = new Date(cert.valid_to);
          const validFrom = new Date(cert.valid_from);
          const now = new Date();
          const daysRemaining = Math.floor((validTo - now) / (1000 * 60 * 60 * 24));
          const valid = socket.authorized !== false && daysRemaining > 0;

          // Domain match: subject CN or SAN must cover the hostname
          const cn = cert.subject?.CN ?? '';
          const san = cert.subjectaltname ?? '';
          const domainMatch = matchesCert(hostname, cn, san);

          const issuer = cert.issuer?.O ?? cert.issuer?.CN ?? 'Unknown';

          resolve({
            valid: valid && domainMatch,
            daysRemaining: Math.max(0, daysRemaining),
            issuer,
            domainMatch,
            validFrom: validFrom.toISOString(),
            validTo: validTo.toISOString(),
          });
        } catch (e) {
          socket.destroy();
          resolve({ valid: false, daysRemaining: 0, issuer: 'Unknown', domainMatch: false, error: e.message });
        }
      }
    );

    socket.setTimeout(8000, () => {
      socket.destroy();
      resolve({ valid: false, daysRemaining: 0, issuer: 'Unknown', domainMatch: false, error: 'SSL connection timed out' });
    });

    socket.on('error', (err) => {
      socket.destroy();
      resolve({ valid: false, daysRemaining: 0, issuer: 'Unknown', domainMatch: false, error: err.message });
    });
  });
}

function matchesCert(hostname, cn, san) {
  const hn = hostname.toLowerCase();
  if (wildcardMatch(hn, cn.toLowerCase())) return true;
  if (san) {
    const entries = san.split(',').map(s => s.trim().replace(/^DNS:/, '').toLowerCase());
    return entries.some(entry => wildcardMatch(hn, entry));
  }
  return false;
}

function wildcardMatch(hostname, pattern) {
  if (pattern.startsWith('*.')) {
    const suffix = pattern.slice(2);
    return hostname.endsWith('.' + suffix) || hostname === suffix;
  }
  return hostname === pattern;
}

module.exports = { checkSSL };
