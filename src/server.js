const express = require('express');
const cors = require('cors'); // Keep this
require('dotenv').config();

const scoringRoutes = require('./routes/scoring.routes');
const gamesRoutes = require('./routes/games.routes');
const aiRoutes = require('./routes/ai.routes');
const contentRoutes = require('./routes/content.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// === Secure CORS Configuration ===
// Get your Vercel frontend URL from .env (e.g., FRONTEND_URL=https://my-app.vercel.app)
const frontendURL = process.env.FRONTEND_URL;

// This whitelist allows your Vercel app (and localhost for testing)
const whitelist = [frontendURL, 'http://localhost:3000', 'http://localhost:5173'];

const corsOptions = {
  origin: function (origin, callback) {
    // Check if the request's origin is in our whitelist
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      // Allow the request
      callback(null, true);
    } else {
      // Block the request
      callback(new Error('Not allowed by CORS'));
    }
  },
  optionsSuccessStatus: 200
};

// === Middleware ===
app.use(cors(corsOptions)); // <-- Use the secure options
app.use(express.json());

// === Routes ===
app.use('/api/scoring', scoringRoutes);
app.use('/api/games', gamesRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/content', contentRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'NeuRazor Backend is running' });
});

// === Error handling ===
// This will catch the CORS error if a blocked origin tries to connect
app.use((err, req, res, next) => {
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      error: 'CORS Error: This origin is not permitted.'
    });
  }
  
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Something went wrong!'
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 NeuRazor Backend running on port ' + PORT);
  console.log('📍 Health check: http://localhost:' + PORT + '/health');
  if (frontendURL) {
    console.log(`🔒 Allowing requests from: ${frontendURL}`);
  } else {
    console.warn('⚠️ FRONTEND_URL is not set. CORS may block production app.');
  }
});