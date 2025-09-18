import { z } from 'zod';

// I used zod.. I am cool right?
export const CreateIssueSchema = z.object({
  id: z.string().optional(), 
  description: z.string().min(1, 'Description is required'),
  type: z.string().min(1, 'Type is required'),
  images: z.array(z.string()).optional().default([]),
  audio: z.string().optional(),
  geotag: z.string().min(1, 'Geotag is required'),
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
