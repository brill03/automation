require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const subdomainRoutes = require('./routes/subdomainRoutes');
const errorHandler = require('./middlewares/errorHandler');

// Initialize app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/subdomains', subdomainRoutes);

// Error handling
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});