// backend/services/cloudflareService.js
const Cloudflare = require('cloudflare');
const { config } = require('dotenv');

config();

const cf = new Cloudflare({
  token: process.env.CLOUDFLARE_API_TOKEN
});

const ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;
const BASE_DOMAIN = process.env.BASE_DOMAIN;

async function createSubdomain(subdomain) {
  try {
    const record = {
      type: 'CNAME',
      name: subdomain,  // e.g., "test" for test.nubisync.com
      content: BASE_DOMAIN,  // Points to your main domain
      ttl: 1,  // Auto TTL
      proxied: true  // Enable Cloudflare proxy (orange cloud)
    };

    const response = await cf.dnsRecords.add(ZONE_ID, record);
    return response.result;
  } catch (err) {
    console.error('Cloudflare API error:', err);
    throw err;
  }
}

module.exports = { createSubdomain };