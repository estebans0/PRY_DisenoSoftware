import { Schema, model, Document, ObjectId } from 'mongoose';

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
}, { timestamps: true });

export const Session = model<ISession>('Session', SessionSchema);


