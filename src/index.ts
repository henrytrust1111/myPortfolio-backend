import express from 'express';
import mongoose from 'mongoose';
import { connectToDatabase } from './utils/db';
import cors from 'cors';
import dotenv from 'dotenv';
import contactRoutes from './routes/contactRoutes';

dotenv.config();

const app = express();

// Middleware
// app.use(cors({
//   origin: process.env.FRONTEND_URL,
//   credentials: true,
// }));
app.use(cors());
app.use(express.json());

// Database Connection (use cached connection helper)

// Routes
app.use('/api', contactRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'Backend is running' });
});

const PORT = process.env.PORT || 5000;
// Connect to database before starting server
(async () => {
  try {
    await connectToDatabase();
    console.log('MongoDB connected');
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('MongoDB error:', err);
    process.exit(1);
  }
})();
// (server is started after DB connection above)