const express = require('express');
const router = express.Router();
const subdomainController = require('../controllers/subdomainController');
const { check, validationResult } = require('express-validator');
const auth = require('../middlewares/auth');

// Public routes
router.post('/check', 
  [
    check('name')
      .not().isEmpty()
      .isLength({ min: 3, max: 63 })
      .matches(/^[a-z0-9-]+$/)
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    subdomainController.checkAvailability(req, res);
  }
);

// Protected routes (add auth middleware if needed)
router.post('/create', 
  auth,
  [
    check('name')
      .not().isEmpty()
      .isLength({ min: 3, max: 63 })
      .matches(/^[a-z0-9-]+$/)
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    subdomainController.createSubdomain(req, res);
  }
);

router.get('/status/:id', auth, subdomainController.getSubdomainStatus);

module.exports = router;