// Leave Management Service - Entry Point
// Demo app for GitHub Copilot + Secure DevOps showcase

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { authenticateJWT } = require('./middleware/auth');
const leaveRoutes = require('./controllers/leaveController');
const { requestLogger } = require('./middleware/logger');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000' }));
app.use(express.json({ limit: '10kb' }));
app.use(requestLogger);

// Routes
app.use('/api/leave', authenticateJWT, leaveRoutes);

// Health check (no auth needed)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Leave Service running on port ${PORT}`));

module.exports = app;
