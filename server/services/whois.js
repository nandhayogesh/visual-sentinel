'use strict';

/**
 * WHOIS / domain age lookup using the whois-json npm package.
 * Extracts creation date, registrar, and registrant country.
 */

const whoisJson = require('whois-json');

async function lookupWhois(hostname) {
  try {
    const data = await whoisJson(hostname, { follow: 3, timeout: 10000 });

    // whois-json returns camelCase keys. Common fields across registrars:
    const rawDate =
      data.creationDate ||
      data.domainRegisteredOn ||
      data.registrationTime ||
      data.registered ||
      null;

    let creationDate = null;
    let domainAge = null;

    if (rawDate) {
      const parsed = Array.isArray(rawDate) ? new Date(rawDate[0]) : new Date(rawDate);
      if (!isNaN(parsed.getTime())) {
        creationDate = parsed.toISOString();
        domainAge = Math.floor((Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24));
      }
    }

    const registrar =
      data.registrar ||
      data.registrarName ||
      null;

    const registrantCountry =
      data.registrantCountry ||
      data.country ||
      data.registrantStateProvince ||
      null;

    return {
      creationDate,
      domainAge,
      registrar: typeof registrar === 'string' ? registrar.trim() : null,
      registrantCountry: typeof registrantCountry === 'string' ? registrantCountry.trim() : null,
    };
  } catch (err) {
    return {
      creationDate: null,
      domainAge: null,
      registrar: null,
      registrantCountry: null,
      error: `WHOIS lookup failed: ${err.message}`,
    };
  }
}

module.exports = { lookupWhois };
