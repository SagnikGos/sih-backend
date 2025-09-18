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
  origin: true,
  credentials: true
};

app.use(cors(corsOptions));
app.use('/api/v1/issues', issuesRouter);

if (process.env.NODE_ENV !== 'production') {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on ${BASE_URL}`);
    });
  });
}

export default connectDB().then(() => app);