const mongoose = require('mongoose');

const subdomainSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[a-z0-9-]+$/, 'Subdomain can only contain letters, numbers, and hyphens'],
    minlength: 3,
    maxlength: 63
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'failed'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Prevent duplicate subdomains
subdomainSchema.index({ name: 1 }, { unique: true });

module.exports = mongoose.model('Subdomain', subdomainSchema);