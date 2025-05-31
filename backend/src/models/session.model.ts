import { Schema, model, Document } from 'mongoose';

export interface ISession extends Document {
  number: string;
  date: Date;
  time: string;
  modality: string;
  location: string;
  attendees: { memberId: string; status: string }[];
  agenda: { title: string; presenter: string; duration: number }[];
}

const SessionSchema = new Schema<ISession>({
  number:     { type: String, required: true },
  date:       { type: Date,   required: true },
  time:       String,
  modality:   String,
  location:   String,
  attendees:  [{ memberId: String, status: String }],
  agenda:     [{ title: String, presenter: String, duration: Number }],
}, { timestamps: true });

export const Session = model<ISession>('Session', SessionSchema);
