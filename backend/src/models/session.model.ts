import { Schema, model, Document, ObjectId } from 'mongoose';

interface IGuest {
  id: number;
  name?: string;
  email: string;
}

export interface ISession extends Document {
  SessionID: ObjectId;
  number: string;
  date: Date;
  time: string;
  modality: string;
  location: string;
<<<<<<< HEAD
  quorum: string;
=======
  quorum: numbe
>>>>>>> e81ff1d800092df0914524e1f1c984dfc5b412cc
  attendees: { memberId: string; status: string }[];
  agenda: { title: string; presenter: string; duration: number }[];
  guests: IGuest[];
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
  quorum:     String,
  attendees:  [{ memberId: String, status: String }],
  guests: [{id: Number, name: String, email :{ type: String, required: true } }],
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
}, { timestamps: true });

export const Session = model<ISession>('Session', SessionSchema);