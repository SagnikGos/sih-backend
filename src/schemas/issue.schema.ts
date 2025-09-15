import { z } from 'zod';

// I used zod.. I am cool right?
export const CreateIssueSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  geotag: z.string().min(1, 'Geotag is required'),
});

export type CreateIssue = z.infer<typeof CreateIssueSchema>;
