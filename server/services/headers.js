'use strict';

/**
 * HTTP headers and redirect chain check using axios.
 * Follows up to 10 redirects, capturing the full chain.
 * Inspects the final response for security headers.
 */

const axios = require('axios');

async function checkHeaders(rawUrl) {
  // Ensure the URL has a scheme
  let url = rawUrl.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  const redirectChain = [];
  let finalUrl = url;
  let statusCode = null;
  let headers = {};
  let server = null;

  try {
    const res = await axios.get(url, {
      maxRedirects: 10,
      timeout: 12000,
      validateStatus: () => true, // accept any status
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
      },
      // Intercept redirects to capture the chain
      beforeRedirect: (options, { headers: respHeaders }) => {
        if (respHeaders.location) redirectChain.push(respHeaders.location);
      },
    });

    finalUrl = res.request?.res?.responseUrl || url;
    statusCode = res.status;
    headers = res.headers || {};
    server = headers['server'] ?? null;
  } catch (err) {
    return {
      hasHSTS: false,
      hasCSP: false,
      hasXFrameOptions: false,
      hasXContentTypeOptions: false,
      hasReferrerPolicy: false,
      statusCode: null,
      finalUrl: url,
      redirectChain,
      redirectCount: redirectChain.length,
      server: null,
      error: `Headers check failed: ${err.message}`,
    };
  }

  const hn = (k) => Object.keys(headers).find(h => h.toLowerCase() === k) ?? null;
  const hv = (k) => { const key = hn(k); return key ? headers[key] : null; };

  return {
    hasHSTS: !!hv('strict-transport-security'),
    hasCSP: !!hv('content-security-policy'),
    hasXFrameOptions: !!hv('x-frame-options'),
    hasXContentTypeOptions: !!hv('x-content-type-options'),
    hasReferrerPolicy: !!hv('referrer-policy'),
    statusCode,
    finalUrl,
    redirectChain,
    redirectCount: redirectChain.length,
    server,
  };
}

module.exports = { checkHeaders };
