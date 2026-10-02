import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';// response from front-end  and allow requests from the front-end to my back-end  or server 
import connectDB from './config/db.js';
import expenseRoutes from './routes/expenseRoutes.js';
import { protect } from './middleware/authMiddleware.js';
import { startKeepAlive } from './utils/keepAlive.js';

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config(); // fallback to root

// Connect to Database
connectDB();// to connect my database

const app = express();// just means to acctivate the server

const PORT = process.env.PORT || 5001;// by default it will run on port 5001

// CORS Configuration
const allowedOrigins = [
  'https://expense-trucker2.onrender.com',
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const cleanOrigin = origin.replace(/\/+$/, '');
    const isAllowed = allowedOrigins.some((allowed) => allowed.replace(/\/+$/, '') === cleanOrigin);
    callback(null, isAllowed);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  optionsSuccessStatus: 200,
};

// Middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());

// Routes – protected by Firebase auth middleware
app.use('/api/expenses', protect, expenseRoutes);

// Health check & keep-alive ping endpoint (public, fast response for cold-start prevention)
app.get(['/api/health', '/api/ping', '/health', '/ping'], (req, res) => {
  res.status(200).json({
    status: 'healthy',
    message: 'Backend API is running and warm',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (req, res) => {
  res.send('Backend API is running');
});

// Global error handler – guarantees CORS headers are present even if errors occur
app.use((err, req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  console.error('[Unhandled Server Error]:', err);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: err.message,
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  startKeepAlive();
});
