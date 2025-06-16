import { Schema, model, Document, ObjectId } from 'mongoose';

// Action interface
interface IAction {
  TipoAccion: string;
  Descripcion: string;
  Responsable?: string;
  DueDate?: Date;
  Estado?: string;
}

// Document interface for storing in SupportingDocuments
interface ISupportingDocument {
  fileName: string;
  fileType: string;
  fileSize: number;
  filePath: string;
  uploadDate: Date;
}

// AgendaItem interface
interface IAgendaItem {
  _id?: any; // Keep for TypeScript compatibility
  Orden: number;
  Titulo: string;
  Duration: number;
  Presenter: string;
  Notas: string;
  Pro: number;
  Against: number;
  EstimatedTime: number;
  Actions?: IAction[];
  SupportingDocuments?: ISupportingDocument[];
}

export interface ISession extends Document {
  SessionID: ObjectId;
  number: string;
  date: Date;
  time: string;
  endTime?: string;
  modality: string;
  location: string;
  quorum: number;
  attendees: { email: string; status: string; role?: string }[]; // Changed memberId to email
  guests?: { name: string; email: string; organization?: string }[];
  agenda: IAgendaItem[];
  type?: string;
  status?: string;
  description?: string;
  minuteMaker?: string; // Email of the person who created the minutes
  minuteSigner?: string; // Email of the person who signed/approved the minutes
}

// Action schema
const ActionSchema = new Schema<IAction>({
  TipoAccion: { type: String, required: true },
  Descripcion: { type: String, required: true },
  Responsable: { type: String },
  DueDate: { type: Date },
  Estado: { type: String }
});

// AgendaItem schema
const AgendaItemSchema = new Schema<IAgendaItem>({
  Orden: { type: Number, required: true },
  Titulo: { type: String, required: true },
  Duration: { type: Number, required: true },
  Presenter: { type: String, required: true },
  Notas: { type: String },
  Pro: { type: Number, default: 0 },
  Against: { type: Number, default: 0 },
  EstimatedTime: { type: Number, required: true },
  Actions: [ActionSchema],
  SupportingDocuments: {}
});

const SessionSchema = new Schema<ISession>({
  SessionID: { type: Schema.Types.ObjectId, auto: true },
  number: { type: String, required: true, unique: true },
  date: { type: Date, required: true },
  time: String,
  endTime: String,
  modality: String,
  location: String,
  quorum: { type: Number, default: 0 },
  attendees: [{ 
    email: String, // Changed from memberId to email
    status: String,
    role: String 
  }],
  guests: [{
    name: String,
    email: String,
    organization: String
  }],
  agenda: [AgendaItemSchema],
  type: String,
  status: String,
  description: String,
}, { timestamps: true });

export const Session = model<ISession>('Session', SessionSchema);


