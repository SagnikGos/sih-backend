import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import issuesRouter from './routes/issues.js';
import { connectDB } from './config/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 6969;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;


const corsOptions = {
  origin: true, // Allow all origins
  credentials: true
};

app.use(cors(corsOptions));

// Static file serving removed - files are now served from Vercel Blob CDN

app.use('/api/v1/issues', issuesRouter);


connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on ${BASE_URL}`);
  });
});