const fetch = require('node-fetch');
const Subdomain = require('../models/Subdomain');
const logger = require('../utils/logger');

class DNSService {
    constructor() {
        this.apiToken = process.env.CLOUDFLARE_API_TOKEN;
        this.zoneId = process.env.CLOUDFLARE_ZONE_ID;
        this.baseDomain = process.env.BASE_DOMAIN;
        this.apiUrl = `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/dns_records`;
        this.headers = {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json'
        };
    }

    async _makeRequest(url, method = 'GET', body = null) {
        try {
            const response = await fetch(url, {
                method,
                headers: this.headers,
                body: body ? JSON.stringify(body) : null
            });

            const data = await response.json();

            if (!data.success) {
                const errors = data.errors.map(err => err.message).join(', ');
                throw new Error(`Cloudflare API error: ${errors}`);
            }

            return data.result;
        } catch (err) {
            logger.error(`API request failed: ${err.message}`);
            throw err;
        }
    }

    async checkExistingRecords(subdomain) {
        try {
            const url = `${this.apiUrl}?type=CNAME&name=${subdomain}.${this.baseDomain}`;
            const records = await this._makeRequest(url);
            return records.length > 0;
        } catch (err) {
            logger.error(`Error checking existing records: ${err.message}`);
            throw err;
        }
    }

    async createSubdomainRecord(subdomain) {
        try {
            // Check if record already exists in Cloudflare
            const exists = await this.checkExistingRecords(subdomain);
            if (exists) {
                throw new Error(`DNS record for ${subdomain} already exists`);
            }

            // Create new CNAME record
            const record = {
                type: 'CNAME',
                name: subdomain,
                content: this.baseDomain,
                ttl: 1, // Automatic TTL
                proxied: true // Enable Cloudflare proxy
            };

            const result = await this._makeRequest(this.apiUrl, 'POST', record);
            logger.info(`Created DNS record for ${subdomain}: ${result.id}`);
            return result;
        } catch (err) {
            logger.error(`Failed to create DNS record: ${err.message}`);
            throw err;
        }
    }

    async deleteSubdomainRecord(subdomain) {
        try {
            // Find the record ID first
            const url = `${this.apiUrl}?type=CNAME&name=${subdomain}.${this.baseDomain}`;
            const records = await this._makeRequest(url);

            if (records.length === 0) {
                logger.warn(`No DNS record found for ${subdomain}`);
                return false;
            }

            // Delete each matching record
            for (const record of records) {
                const deleteUrl = `${this.apiUrl}/${record.id}`;
                await this._makeRequest(deleteUrl, 'DELETE');
                logger.info(`Deleted DNS record ${record.id} for ${subdomain}`);
            }

            return true;
        } catch (err) {
            logger.error(`Failed to delete DNS record: ${err.message}`);
            throw err;
        }
    }

    async updateSubdomainStatus(subdomainId, status) {
        try {
            await Subdomain.findByIdAndUpdate(subdomainId, { 
                status,
                updatedAt: new Date()
            });
            logger.info(`Updated subdomain ${subdomainId} status to ${status}`);
        } catch (err) {
            logger.error(`Failed to update subdomain status: ${err.message}`);
            throw err;
        }
    }
}

module.exports = new DNSService();