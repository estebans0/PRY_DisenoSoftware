import { Schema, model, Document } from 'mongoose';

export interface Notificacion extends Document {
  sender:        string;              // e.g. 'SYSTEM'
  recipient:     string;              // single JD email
  type:          'info'|'warning'|'error';
  subject:       string;
  body:          string;
  sessionNumber: string;
  timestamp:     Date;
  read:          boolean;
  createdAt?:    Date;
  updatedAt?:    Date;
}

const notificacionSchema = new Schema<Notificacion>(
  {
    sender:        { type: String, required: true, trim: true },
    recipient:     { type: String, required: true, index: true },
    type:          { 
      type:     String, 
      required: true, 
      enum:     ['info', 'warning', 'error'] 
    },
    subject:       { type: String, required: true, trim: true },
    body:          { type: String, required: true, trim: true },
    sessionNumber: { type: String, required: true, trim: true },
    timestamp:     { type: Date,   default: Date.now },
    read:          { type: Boolean, default: false }
  },
  { timestamps: true }
);

export const NotificacionModel = model<Notificacion>(
  'Notificacion',
  notificacionSchema
);
