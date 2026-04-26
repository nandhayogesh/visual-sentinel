'use strict';

/**
 * GeoIP lookup using the geoip-lite package.
 * Maps an IP address to country, city, and coordinates.
 * ASN/ISP data is derived from URLScan results where available.
 */

// We have removed 'geoip-lite' because its internal >100MB database exceeds Vercel Serverless Function 50MB limits.
// Instead, we derive GeoIP and ASN/ISP data efficiently from the URLScan results.

function lookupGeo(ip, urlscanResult) {
  if (!ip) return null;

  try {
    const countryStr = urlscanResult?.country;
    const ispName = urlscanResult?.asnName ?? 'Unknown';

    // If urlscan lacks info, gracefully return unknown.
    if (!countryStr && ispName === 'Unknown') {
        return {
          country: 'Unknown',
          countryCode: 'Unknown',
          city: 'Unknown',
          isp: 'Unknown',
          org: 'Unknown',
          as: 'Unknown',
        };
    }

    return {
      country: countryStr ? getCountryName(countryStr) : 'Unknown',
      countryCode: countryStr ?? 'Unknown',
      city: 'Unknown', // URLscan doesn't provide city granularity reliably
      isp: ispName,
      org: ispName,
      as: urlscanResult?.asnName ?? '',
    };
  } catch (_) {
    return null;
  }
}

// Minimal country code → name map for common entries
const COUNTRY_NAMES = {
  US: 'United States', GB: 'United Kingdom', DE: 'Germany', FR: 'France',
  CN: 'China', RU: 'Russia', IN: 'India', BR: 'Brazil', AU: 'Australia',
  CA: 'Canada', JP: 'Japan', KR: 'South Korea', NL: 'Netherlands',
  SG: 'Singapore', HK: 'Hong Kong', SE: 'Sweden', NO: 'Norway',
  UA: 'Ukraine', NG: 'Nigeria', PK: 'Pakistan', IR: 'Iran',
};

function getCountryName(code) {
  return COUNTRY_NAMES[code] ?? code;
}

module.exports = { lookupGeo };
