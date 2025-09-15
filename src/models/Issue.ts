import { Schema, model, Document } from 'mongoose';


export interface IIssue extends Document {
  title: string;
  description: string;
  geotag: string;
  imageUrls: string[];
  status: 'Reported' | 'In Progress' | 'Resolved';
  timestamp: Date;
}

// change this when we have the frontend -- sagnik
const IssueSchema = new Schema<IIssue>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  geotag: { type: String, required: true },
  imageUrls: [{ type: String, required: true }],
  status: {
    type: String,
    enum: ['Reported', 'In Progress', 'Resolved'],
    default: 'Reported',
  },
  timestamp: { type: Date, default: Date.now },
});


const Issue = model<IIssue>('Issue', IssueSchema);
export default Issue;