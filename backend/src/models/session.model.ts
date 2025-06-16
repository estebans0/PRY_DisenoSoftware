import { Schema, model, Document, ObjectId } from 'mongoose';

export interface ISession extends Document {
  SessionID: ObjectId;
  number: string;
  date: Date;
  time: string;
  modality: string;
  location: string;
  quorum: number;
  status: 'scheduled' | 'in-progress' | 'completed'; // Nuevo campo de estado
  attendees: { 
    memberId: string; 
    status: 'confirmed' | 'pending' | 'declined' | 'present' | 'absent'; // Estados ampliados
  }[];
  agenda: { 
    title: string; 
    presenter: string; 
    duration: number;
    notes?: string;
    voting?: {
      inFavor: number;
      against: number;
      abstain: number;
      result: string;
    };
    tasks?: Array<{ description: string; assignee: string }>;
  }[];
  startTime?: Date;
  endTime?: Date;
}

const SessionSchema = new Schema<ISession>({
  SessionID: { type: Schema.Types.ObjectId, auto: true },
  number:     { type: String, required: true },
  date:       { type: Date,   required: true },
  time:       String,
  modality:   String,
  location:   String,
  quorum:     { type: Number, default: 0 },
  status:     { type: String, enum: ['scheduled', 'in-progress', 'completed'], default: 'scheduled' },
  startTime:  Date,
  endTime:    Date,
  attendees:  [{ 
    memberId: String, 
    status: { type: String, enum: ['confirmed', 'pending', 'declined', 'present', 'absent'] }
  }],
  agenda:     [{
    title: String,
    presenter: String,
    duration: Number,
    notes: String,
    voting: {
      inFavor: Number,
      against: Number,
      abstain: Number,
      result: String
    },
    tasks: [{
      description: String,
      assignee: String
    }]
  }]
}, { timestamps: true });

export const Session = model<ISession>('Session', SessionSchema);