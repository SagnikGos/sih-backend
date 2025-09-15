import express, { type Request, type Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Issue from '../models/Issue.js';
import { CreateIssueSchema } from '../schemas/issue.schema.js';
import { validateBody } from '../middleware/validation.js';

const router = express.Router();


const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// GET /api/issues - Get all issues
router.get('/', async (req: Request, res: Response) => {
  try {
    const issues = await Issue.find().sort({ timestamp: -1 });
    res.status(200).json(issues);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching issues.' });
  }
});

// POST /api/issues - Create new issue
router.post('/', upload.array('images', 5), validateBody(CreateIssueSchema), async (req: Request, res: Response) => {
  try {
    // change this when we have the frontend -- sagnik
    const { title, description, geotag } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'At least one image is required.' });
    }

    const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 8080}`;
    const imageUrls = files.map(file => `${BASE_URL}/uploads/${file.filename}`);

    const newIssue = new Issue({
      title,
      description,
      geotag,
      imageUrls,
    });

    await newIssue.save();
    res.status(201).json(newIssue);
  } catch (error) {
    console.error('Error creating issue:', error);
    res.status(500).json({ message: 'Server error while creating issue.' });
  }
});

export default router;
