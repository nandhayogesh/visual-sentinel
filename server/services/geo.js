'use strict';

/**
 * GeoIP lookup using the geoip-lite package.
 * Maps an IP address to country, city, and coordinates.
 * ASN/ISP data is derived from URLScan results where available.
 */

const geoip = require('geoip-lite');

function lookupGeo(ip, urlscanResult) {
  if (!ip) return null;

  try {
    const geo = geoip.lookup(ip);
    if (!geo) return null;

    // Pull ISP/ASN from URLScan if available, otherwise mark as unknown
    const isp = urlscanResult?.asnName ?? 'Unknown';
    const asn = urlscanResult?.asnName ?? '';

    return {
      country: geo.country ? getCountryName(geo.country) : 'Unknown',
      countryCode: geo.country ?? 'Unknown',
      city: geo.city ?? 'Unknown',
      isp,
      org: isp,
      as: asn,
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
