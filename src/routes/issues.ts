import express, { type Request, type Response, type NextFunction } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { put } from '@vercel/blob';
import Issue from '../models/Issue.js';
import { CreateIssueBodySchema } from '../schemas/issue.schema.js';
import { validateBody } from '../middleware/validation.js';
import { reverseGeocode, getOSMAttribution } from '../services/geocoder.js';

const router = express.Router();


// ✅ Use memory storage instead of disk storage for Vercel Blob
const upload = multer({
  storage: multer.memoryStorage(), // Use memoryStorage instead of diskStorage
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

// Middleware to parse geotag JSON string
const parseGeotag = (req: Request, res: Response, next: NextFunction) => {
  if (req.body.geotag && typeof req.body.geotag === 'string') {
    try {
      req.body.geotag = JSON.parse(req.body.geotag);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid geotag JSON format' });
    }
  }
  next();
};

// GET /api/v1/issues - Get all issues
router.get('/', async (req: Request, res: Response) => {
  try {
    const issues = await Issue.find().sort({ datetime: -1 });
    const responseData = {
      issues,
      attribution: getOSMAttribution()
    };
    res.status(200).json(responseData);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching issues.' });
  }
});



// POST /api/v1/issues - Create new issue
router.post('/', uploader, parseAssignedTo, parseGeotag, validateBody(CreateIssueBodySchema), async (req: Request, res: Response) => {
  try {
    const files = req.files as { images?: Express.Multer.File[], audio?: Express.Multer.File[] };
    let imageUrls = [];
    let audioUrl;

    // --- Upload images to Vercel Blob ---
    if (files.images && files.images.length > 0) {
      for (const file of files.images) {
        const blob = await put(file.originalname, file.buffer, {
          access: 'public',
        });
        imageUrls.push(blob.url); // Add the public URL from Vercel
      }
    }

    // --- Upload audio to Vercel Blob ---
    if (files.audio && files.audio.length > 0) {
      const audioFile = files.audio[0];
      if (audioFile) {
        const blob = await put(audioFile.originalname, audioFile.buffer, {
          access: 'public',
        });
        audioUrl = blob.url; // Get the public URL
      }
    }

    console.log('🔴 Processed imageUrls from Vercel Blob:', imageUrls);
    console.log('🔴 Processed audioUrl from Vercel Blob:', audioUrl);

    // --- Reverse geocoding for place name ---
    let geotagWithPlaceName = { ...req.body.geotag };
    
    if (req.body.geotag && req.body.geotag.lat && req.body.geotag.lng) {
      try {
        const geocoderResult = await reverseGeocode(req.body.geotag.lat, req.body.geotag.lng);
        if (geocoderResult) {
          geotagWithPlaceName.placeName = geocoderResult.placeName;
          console.log('🔴 Reverse geocoded place name:', geocoderResult.placeName);
        } else {
          // Fallback to coordinates if geocoding fails
          geotagWithPlaceName.placeName = `${req.body.geotag.lat}, ${req.body.geotag.lng}`;
          console.log('🔴 Geocoding failed, using coordinates as place name');
        }
      } catch (geocodingError) {
        console.error('Error during reverse geocoding:', geocodingError);
        // Fallback to coordinates if geocoding fails
        geotagWithPlaceName.placeName = `${req.body.geotag.lat}, ${req.body.geotag.lng}`;
      }
    }

    // Now, save these new URLs to your database as before
    const newIssueData = {
      id: uuidv4(),
      ...req.body,
      geotag: geotagWithPlaceName,
      images: imageUrls,
      audio: audioUrl,
      datetime: new Date(),
    };
    
    const newIssue = new Issue(newIssueData);
    await newIssue.save();
    
    // Include OSM attribution in the response
    const responseData = {
      ...newIssue.toObject(),
      attribution: getOSMAttribution()
    };
    
    res.status(201).json(responseData);

  } catch (error) {
    console.error('Error creating issue:', error);
    res.status(500).json({ message: 'Server error while creating issue.' });
  }
});

export default router;