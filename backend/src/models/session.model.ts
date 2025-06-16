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
  quorum: number;
  attendees: { memberId: string; status: string }[];
  agenda: { title: string; presenter: string; duration: number }[];
  guests: IGuest[];
}

const SessionSchema = new Schema<ISession>({
  SessionID: { type: Schema.Types.ObjectId, auto: true },
  number:     { type: String, required: true },
  date:       { type: Date,   required: true },
  time:       String,
  modality:   String,
  location:   String,
  quorum:     { type: Number, default: 0 },
  attendees:  [{ memberId: String, status: String }],
  guests: [{id: Number, name: String, email :{ type: String, required: true } }],
}, { timestamps: true });

export const Session = model<ISession>('Session', SessionSchema);


