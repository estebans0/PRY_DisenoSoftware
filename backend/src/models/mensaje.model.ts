import { Schema, model, Document, ObjectId } from 'mongoose';


export interface Mensaje extends Document {
  Title: string;
  SessionNumber: string;
  date: Date;
  mensaje: string;
  recipients: string[];
  read: boolean;

}

const mensajeSchema = new Schema<Mensaje>(
    {
        Title: { type: String, required: true, trim: true },
        SessionNumber: { type: String, required: true, trim: true },
        date: { type: Date, default: Date.now },
        mensaje: { type: String, required: true, trim: true },
        recipients: [{ type: String, required: true }],
        read: { type: Boolean, default: false }
    },
    { timestamps: true }
)

export const MensajeModel = model<Mensaje>('Mensaje', mensajeSchema);