import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IDocument extends Document {
  filename: string;
  path: string;
  mimetype: string;
  size: number;
  uploadDate: Date;
}

const DocumentSchema = new Schema<IDocument>({
  filename: { type: String, required: true },
  path: { type: String, required: true },
  mimetype: { type: String, required: true },
  size: { type: Number, required: true },
  uploadDate: { type: Date, default: Date.now }
});

export const DocumentModel = mongoose.model<IDocument>('Document', DocumentSchema);