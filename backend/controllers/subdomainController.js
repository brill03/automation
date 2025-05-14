const Subdomain = require('../models/Subdomain');
const dnsService = require('../services/dnsService');
const deployService = require('../services/deployService');
const logger = require('../utils/logger');

exports.checkAvailability = async (req, res) => {
    try {
        const { name } = req.body;
        
        // Validate input
        if (!name || typeof name !== 'string') {
            return res.status(400).json({ error: 'Subdomain name is required' });
        }

        // Check database
        const dbExists = await Subdomain.findOne({ name });
        
        // Check DNS records
        const dnsExists = await dnsService.checkExistingRecords(name);
        
        res.json({ 
            available: !dbExists && !dnsExists,
            suggested: dbExists || dnsExists ? 
                `${name}-${Math.floor(Math.random() * 1000)}` : null
        });
    } catch (err) {
        logger.error(`Availability check failed: ${err.message}`);
        res.status(500).json({ error: err.message });
    }
};

exports.createSubdomain = async (req, res) => {
    try {
        const { name } = req.body;
        
        // Validate input
        if (!name || !/^[a-z0-9-]+$/.test(name)) {
            return res.status(400).json({ error: 'Invalid subdomain name' });
        }

        // Check availability
        const dbExists = await Subdomain.findOne({ name });
        const dnsExists = await dnsService.checkExistingRecords(name);
        
        if (dbExists || dnsExists) {
            return res.status(409).json({ 
                error: 'Subdomain already exists',
                existingIn: dbExists ? 'database' : 'DNS records'
            });
        }

        // Create database record
        const subdomain = new Subdomain({ 
            name,
            status: 'queued',
            owner: req.user?.id
        });

        await subdomain.save();

        // Start deployment process (async)
        const { queued, position } = await deployService.provisionResources(subdomain._id);

        res.status(202).json({ 
            message: 'Subdomain creation in progress',
            subdomain: {
                id: subdomain._id,
                name: subdomain.name,
                status: subdomain.status,
                queuePosition: position
            }
        });
    } catch (err) {
        logger.error(`Subdomain creation failed: ${err.message}`);
        res.status(500).json({ error: err.message });
    }
};

exports.getSubdomainStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const subdomain = await Subdomain.findById(id);
        
        if (!subdomain) {
            return res.status(404).json({ error: 'Subdomain not found' });
        }

        res.json({
            name: subdomain.name,
            status: subdomain.status,
            createdAt: subdomain.createdAt,
            updatedAt: subdomain.updatedAt
        });
    } catch (err) {
        logger.error(`Status check failed: ${err.message}`);
        res.status(500).json({ error: err.message });
    }
};

exports.listSubdomains = async (req, res) => {
    try {
        const subdomains = await Subdomain.find({ owner: req.user?.id })
            .sort({ createdAt: -1 })
            .select('name status createdAt updatedAt');
            
        res.json(subdomains);
    } catch (err) {
        logger.error(`List subdomains failed: ${err.message}`);
        res.status(500).json({ error: err.message });
    }
};