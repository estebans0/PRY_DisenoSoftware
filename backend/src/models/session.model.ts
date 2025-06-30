import { Schema, model, Document, ObjectId, Types, InferSchemaType } from 'mongoose';
import { ISessionVisitor, IVisitableSession } from '../Visitor/visitor.interfaces';

// extract the TypeScript type of one agenda‐item
export type AgendaItemType = InferSchemaType<typeof AgendaItemSchema>;
export type AttendeeType   = InferSchemaType<typeof AttendeeSchema>;
export type GuestType      = InferSchemaType<typeof GuestSchema>;
export type DocType        = InferSchemaType<typeof DocumentSchema>;

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
  _id: Types.ObjectId;
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
  SupportingDocuments?: Types.ObjectId[];
}

// --- Supporting sub‐schemas ---

const AttendeeSchema = new Schema({
  name:   { type: String, required: true },
  email:  { type: String, default: '' },
  status: { type: String, enum: ['Confirmed','Pending','Declined'], default: 'Pending' },
  role:   { type: String, default: 'Guest' },
}, { _id: true });

const ActionSchema = new Schema({
  description: { type: String, required: true },
  assignee:    {
    _id:   { type: Schema.Types.ObjectId, ref: 'User' },
    name:  { type: String, required: true }
  },
  dueDate:     { type: Date }
}, { _id: true });

const DocumentSchema = new Schema({
  fileName:   { type: String, required: true },
  fileType:   { type: String, required: true },
  fileSize:   { type: Number, required: true },
  filePath:   { type: String, required: true },
  uploadDate: { type: Date,   required: true, default: () => new Date() }
}, { _id: true });

const AgendaItemSchema = new Schema({
  order:         { type: Number, required: true },
  title:         { type: String, required: true },
  duration:      { type: Number, required: true },
  description:   { type: String, default: '' },
  presenter:     { type: String, required: true },
  notes:         { type: String, default: '' },
  tipoPunto:     { type: String, enum: ['Aprobaciones','informativa', 'fondo estrategia y desarrollo', 'varios'], default: 'Aprobaciones' }, //actualizado segun especificacion
  pro:           [AttendeeSchema],
  against:       [AttendeeSchema],
  abstained:     [AttendeeSchema],
  actions:       [ActionSchema],
  estimatedTime: { type: Number, required: true },
  documents:     [DocumentSchema],

  // ─── NEW ─── store the final voting result
  decision: {
    type: String,
    enum: ['Approved','Rejected','Deferred'],
    default: null
  },

  // ─── RESPONSIBLE PERSON ─── for 'fondo estrategia y desarrollo' items
  responsible: {
    name:   { type: String },
    email:  { type: String }
  }

}, { _id: true });

const GuestSchema = new Schema({
  id:    { type: Number, required: true },
  name:  String,
  email: { type: String, required: true }
}, { _id: false });

// --- Main Session schema ---

export interface ISession extends Document, IVisitableSession {
  number:       string;
  type:         string;
  date:         Date;
  time:         string;
  location:     string;
  modality:     'In Person' | 'Virtual' | 'Hybrid';
  status:       'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
  quorum:       'Pending' | 'Achieved' | 'Not Achieved';
  startTime?:   Date;
  endTime?:     Date;
  createdBy:    { _id: Types.ObjectId; name: string };
  attendees:    AttendeeType[];
  description?: string;
  guests:       GuestType[];
  agenda:       AgendaItemType[];
  documents?:   DocType[];
}

const SessionSchema = new Schema<ISession>({
  number:     { type: String, required: true, unique: true },
  type:       { type: String, required: true },       // ordinary/extraordinary
  date:       { type: Date,   required: true },
  time:       { type: String, required: true },
  location:   { type: String, required: true },

  // ─── NEW ───
  modality: {
    type:     String,
    required: true,
    enum:     ['In Person','Virtual','Hybrid'],
    default:  'In Person'
  },

  // ─── EXTENDED ───
  status: {
    type: String,
    enum: ['Scheduled','In Progress','Completed','Cancelled'],
    default: 'Scheduled',
    // whenever someone sets .status, coerce common lowercase/varied inputs
    set: (v: string) => {
      if (!v) return v;
      const lower = v.toString().toLowerCase().trim();
      switch (lower) {
        case 'scheduled':
          return 'Scheduled';
        case 'in progress':
        case 'in-progress':
        case 'inprogress':
          return 'In Progress';
        case 'completed':
          return 'Completed';
        case 'cancelled':
        case 'canceled':
          return 'Cancelled';
        default:
          // let it through—if it’s not one of the enum values, validation will still catch it
          return v;
      }
    }
  },

  quorum:     { type: String, enum: ['Pending','Achieved','Not Achieved'], default: 'Achieved' },

  // ─── ADDED ───
  startTime:  { type: Date },
  endTime:    { type: Date },

  createdBy:  {
    _id:  { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    name: { type: String, required: true }
  },

  attendees:  [AttendeeSchema],
  description:{ type: String },
  guests:     [GuestSchema],
  agenda:     [AgendaItemSchema],

  // ─── NEW ───
  documents:  [DocumentSchema]

}, {
  timestamps: true
});

SessionSchema.methods.accept = async function(visitor: ISessionVisitor): Promise<void> {
    await visitor.visitSession(this);
    for (const item of this.agenda) {
        await visitor.visitAgendaItem(item);
    }
};

export const Session = model<ISession>('Session', SessionSchema);
export {
    
    AgendaItemSchema,
    
};