// backend/src/models/session.model.ts
import { Schema, model, Document, Types } from 'mongoose';

// --- Supporting sub‐schemas ---

const AttendeeSchema = new Schema({
  name:      { type: String, required: true },
  email:     { type: String, required: true },
  status:    { type: String, enum: ['Confirmed','Pending','Declined'], default: 'Pending' },
  role:      { type: String, default: 'Guest' },
}, { _id: true });

const ActionSchema = new Schema({
  description: { type: String, required: true },
  assignee:    {
    _id:   { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    name:  { type: String, required: true }
  },
  dueDate:     { type: Date }
}, { _id: true });

const DocumentSchema = new Schema({
  fileName:   { type: String, required: true },
  fileType:   { type: String, required: true },
  fileSize:   { type: Number, required: true },
  filePath:   { type: String, required: true },
  uploadDate: { type: Date,   required: true, default: () => new Date() }
}, { _id: true });

const AgendaItemSchema = new Schema({
  order:         { type: Number, required: true },
  title:         { type: String, required: true },
  duration:      { type: Number, required: true },
  presenter:     { type: String, required: true },
  pro:           [AttendeeSchema],
  against:       [AttendeeSchema],
  abstained:     [AttendeeSchema],
  actions:       [ActionSchema],
  estimatedTime: { type: Number, required: true },
  documents:     [DocumentSchema]
}, { _id: true });

const GuestSchema = new Schema({
  id:    { type: Number, required: true },
  name:  String,
  email: { type: String, required: true }
}, { _id: false });

// --- Main Session schema ---

export interface ISession extends Document {
  number:       string;
  type:         string;
  date:         Date;
  time:         string;
  location:     string;
  modality:     'In Person' | 'Virtual' | 'Hybrid';
  status:       'Scheduled' | 'Completed' | 'Cancelled';
  quorum:       'Pending' | 'Achieved' | 'Not Achieved';
  createdBy:    { _id: Types.ObjectId; name: string };
  attendees:    typeof AttendeeSchema[];
  description?: string;
  guests:       typeof GuestSchema[];
  agenda:       typeof AgendaItemSchema[];
  documents?:   typeof DocumentSchema[];   // <— top-level docs
}

const SessionSchema = new Schema<ISession>({
  number:     { type: String, required: true, unique: true },
  type:       { type: String, required: true },       // ordinary/extraordinary
  date:       { type: Date,   required: true },
  time:       { type: String, required: true },
  location:   { type: String, required: true },

  // ─── NEW ───
  modality: {
    type:    String,
    required:true,
    enum:    ['In Person','Virtual','Hybrid'],
    default: 'In Person'
  },

  status:     { type: String, enum: ['Scheduled','Completed','Cancelled'], default: 'Scheduled' },
  quorum:     { type: String, enum: ['Pending','Achieved','Not Achieved'], default: 'Pending' },
  createdBy:  {
    _id:  { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    name: { type: String, required: true }
  },

  attendees:  [AttendeeSchema],
  description:{ type: String },
  guests:     [GuestSchema],
  agenda:     [AgendaItemSchema],

  // ─── NEW ───
  documents:  [DocumentSchema]

}, {
  timestamps: true
});

export const Session = model<ISession>('Session', SessionSchema);
