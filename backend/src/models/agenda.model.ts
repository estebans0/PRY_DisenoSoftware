import mongoose, { Document, Schema, Types } from 'mongoose';

// Action interface
interface IAction {
  TipoAccion: string;
  Descripcion: string;
}

// AgendaItem interface
export interface IAgendaItem {
  Orden: number;
  Titulo: string;
  Duration: number;
  Presenter: string;
  Notas: string;
  Pro: number;
  Against: number;
  EstimatedTime: number;
  Actions?: IAction[];
  SupportingDocuments?: Types.ObjectId[];
}

// SessionAgenda interface
export interface ISessionAgenda extends Document {
  NumeroSession: Types.ObjectId;
  SessionAgenda: IAgendaItem[];
}

// Action schema
const ActionSchema = new Schema<IAction>({
  TipoAccion: { type: String, required: true },
  Descripcion: { type: String, required: true }
});

// AgendaItem schema
const AgendaItemSchema = new Schema<IAgendaItem>({
  Orden: { type: Number, required: true },
  Titulo: { type: String, required: true },
  Duration: { type: Number, required: true },
  Presenter: { type: String, required: true }, // Email address
  Notas: { type: String },
  Pro: { type: Number, default: 0 },
  Against: { type: Number, default: 0 },
  EstimatedTime: { type: Number, required: true },
  Actions: [ActionSchema],
  SupportingDocuments: [{ type: Schema.Types.ObjectId, ref: 'Document' }]
});

// SessionAgenda schema
const SessionAgendaSchema = new Schema<ISessionAgenda>({
  NumeroSession: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
  SessionAgenda: [AgendaItemSchema]
});

// Add a unique index on NumeroSession
SessionAgendaSchema.index({ NumeroSession: 1 }, { unique: true });

export const SessionAgenda = mongoose.model<ISessionAgenda>('SessionAgenda', SessionAgendaSchema, 'sesionAgenda');