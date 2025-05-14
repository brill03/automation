// backend/routes/subdomainRoutes.js
const express = require('express');
const router = express.Router();
const { createSubdomain } = require('../services/cloudflareService');

router.post('/create', async (req, res) => {
  const { name } = req.body;
  
  try {
    // Validate input
    if (!/^[a-z0-9-]+$/.test(name) || name.length < 3) {
      return res.status(400).json({ error: 'Invalid subdomain format' });
    }

    // Create DNS record
    await createSubdomain(name);
    
    res.json({ 
      success: true,
      url: `https://${name}.${process.env.BASE_DOMAIN}`
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create subdomain' });
  }
});