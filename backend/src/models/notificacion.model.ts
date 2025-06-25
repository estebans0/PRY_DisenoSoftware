import { Schema, model, Document, ObjectId} from 'mongoose';


export interface Notificacion extends Document {
  Title: string;
  SessionNumber: string;
  date: Date;
  recipients: string[];
  type: 'info' | 'warning' | 'error';

}

const notificacionSchema = new Schema<Notificacion>(
    {
        Title: { type: String, required: true, trim: true },
        SessionNumber: { type: String, required: true, trim: true },
        date: { type: Date, default: Date.now },
        recipients: [{ type: String, required: true }],
        type: { type: String, required: true, enum: ['info', 'warning', 'error'] }
    },
    { timestamps: true }
)

export const NotificacionModel = model<Notificacion>('Notificacion', notificacionSchema);