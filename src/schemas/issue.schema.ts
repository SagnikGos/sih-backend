import { z } from 'zod';

export const CreateIssueSchema = z.object({
  id: z.string().optional(), 
  description: z.string().min(1, 'Description is required'),
  type: z.string().min(1, 'Type is required'),
  images: z.array(z.string()).optional().default([]),
  audio: z.string().optional(),
  geotag: z.object({
    lat: z.number().min(-90).max(90, 'Latitude must be between -90 and 90'),
    lng: z.number().min(-180).max(180, 'Longitude must be between -180 and 180'),
    placeName: z.string().optional()
  }),
  datetime: z.date().optional(), 
  priority: z.enum(['high', 'medium', 'low']).optional(),
  status: z.enum(['pending', 'assigned', 'processing', 'resolved']).optional().default('pending'),
  assignedTo: z.object({
    id: z.string(),
    name: z.string(),
    area: z.string()
  }).optional()
});

export const CreateIssueBodySchema = CreateIssueSchema.omit({ 
  images: true, 
  audio: true 
});

export type CreateIssue = z.infer<typeof CreateIssueSchema>;
