import express, { type Request, type Response, type NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import Issue from '../models/Issue.js';
import { CreateIssueBodySchema } from '../schemas/issue.schema.js';
import { validateBody } from '../middleware/validation.js';

const router = express.Router();


const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname);
    cb(null, filename);
  },
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and audio files are allowed!'));
    }
  }
});

const uploader = upload.fields([
  { name: 'images', maxCount: 5 },
  { name: 'audio', maxCount: 1 }
]);


// Middleware to parse assignedTo JSON string
const parseAssignedTo = (req: Request, res: Response, next: NextFunction) => {
  if (req.body.assignedTo && typeof req.body.assignedTo === 'string') {
    try {
      req.body.assignedTo = JSON.parse(req.body.assignedTo);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid assignedTo JSON format' });
    }
  }
  next();
};

// GET /api/v1/issues - Get all issues
router.get('/', async (req: Request, res: Response) => {
  try {
    const issues = await Issue.find().sort({ datetime: -1 });
    res.status(200).json(issues);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching issues.' });
  }
});



// POST /api/v1/issues - Create new issue
router.post('/', uploader, parseAssignedTo, validateBody(CreateIssueBodySchema), async (req: Request, res: Response) => {
  try {
    const files = req.files as { images?: Express.Multer.File[], audio?: Express.Multer.File[] };

    const imageUrls = files.images?.map(file => `/uploads/${file.filename}`) || [];
    const audioUrl = files.audio?.[0] ? `/uploads/${files.audio[0].filename}` : undefined;

    const newIssueData = {
      id: uuidv4(),
      ...req.body,
      images: imageUrls,
      audio: audioUrl,
      datetime: new Date(),
    };
    
    const newIssue = new Issue(newIssueData);

    await newIssue.save();
    res.status(201).json(newIssue);
  } catch (error) {
    console.error('Error creating issue:', error);
    res.status(500).json({ message: 'Server error while creating issue.' });
  }
});

export default router;