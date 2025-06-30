import { Schema, model, Document } from 'mongoose';

export interface Mensaje extends Document {
  sender:        string;       // who sent it (e.g. 'SYSTEM')
  recipients:    string[];     // one or more MiembroJD emails
  subject:       string;       // asunto
  body:          string;       // contenido
  sessionNumber: string;       // tie back to session
  timestamp:     Date;         // fecha y hora
  read:          boolean;      // marcar como leído

  // These come from `timestamps: true` in the schema options
  createdAt?:    Date;
  updatedAt?:    Date;
}

const mensajeSchema = new Schema<Mensaje>(
  {
    sender:        { type: String, required: true, trim: true },
    recipients:    [{ type: String, required: true, index: true }],
    subject:       { type: String, required: true, trim: true },
    body:          { type: String, required: true, trim: true },
    sessionNumber: { type: String, required: true, trim: true },
    timestamp:     { type: Date,   default: Date.now },
    read:          { type: Boolean, default: false }
  },
  {
    timestamps: true  // adds createdAt & updatedAt automatically
  }
);

export const MensajeModel = model<Mensaje>('Mensaje', mensajeSchema);
