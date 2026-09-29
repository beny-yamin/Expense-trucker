import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';// response from front-end  and allow requests from the front-end to my back-end  or server 
import connectDB from './config/db.js';
import expenseRoutes from './routes/expenseRoutes.js';
import { protect } from './middleware/authMiddleware.js';

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

// Middleware
app.use(cors());// to allow requests from the front-end to my back-end  or server 
app.use(express.json());// allows the server to accept and parse JSON data in the body of requests

// Routes – protected by Firebase auth middleware
app.use('/api/expenses', protect, expenseRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
