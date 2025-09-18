import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import issuesRouter from './routes/issues.js';
import { connectDB } from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 6969;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;


const corsOptions = {
  origin: true, // Allow all origins
  credentials: true
};

app.use(cors(corsOptions));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/v1/issues', issuesRouter);


connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on ${BASE_URL}`);
  });
});