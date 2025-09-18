import { Schema, model, Document } from 'mongoose';

export interface IAssignedTo {
  id: string;
  name: string;
  area: string;
}

export interface IIssue extends Document {
  id: string;
  description: string;
  type: string;
  images: string[];
  audio?: string;
  geotag: string;
  datetime: Date;
  priority?: 'high' | 'medium' | 'low';
  status: 'pending' | 'assigned' | 'processing' | 'resolved';
  assignedTo?: IAssignedTo;
}

const AssignedToSchema = new Schema<IAssignedTo>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  area: { type: String, required: true }
}, { _id: false });

const IssueSchema = new Schema<IIssue>({
  id: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  type: { type: String, required: true },
  images: [{ type: String, default: [] }],
  audio: { type: String },
  geotag: { type: String, required: true },
  datetime: { type: Date, default: Date.now },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'processing', 'resolved'],
    default: 'pending'
  },
  assignedTo: { type: AssignedToSchema }
});

const Issue = model<IIssue>('Issue', IssueSchema);
export default Issue;