import { Schema, model, Document, Types } from 'mongoose';

// Define action interface
export interface IAction {
  TipoAccion: string;
  Descripcion: string;
}

// Define agenda item interface
export interface IAgendaItem extends Document {
  Orden: number;
  Titulo: string;
  Duration: number;
  Presenter: Types.ObjectId;  // Should reference a user
  Notas?: string;
  Pro?: number;
  Against?: number;
  EstimatedTime?: number;
  Actions?: IAction[];
  SupportingDocuments?: Types.ObjectId[];
}

// Define main session document
export interface Agenda extends Document {
  sessionId: Types.ObjectId;  // Reference to main session
  agendaItems: IAgendaItem[]; // Array of agenda items
}

// Action schema
const ActionSchema = new Schema<IAction>({
  TipoAccion: { type: String, required: true },
  Descripcion: { type: String, required: true }
}, { _id: false });

// Agenda item schema
const AgendaItemSchema = new Schema<IAgendaItem>({
  Orden: { 
    type: Number, 
    required: true,
    min: [1, 'Order must be at least 1']
  },
  Titulo: { 
    type: String, 
    required: [true, 'Title is required'] 
  },
  Duration: { 
    type: Number, 
    required: true,
    min: [1, 'Duration must be at least 1 minute']
  },
  Presenter: { 
    type: Schema.Types.ObjectId, 
    required: true,
    ref: 'User'  // Reference to user model
  },
  Notas: String,
  Pro: Number,
  Against: Number,
  EstimatedTime: Number,
  Actions: {
    type: [ActionSchema],
    validate: {
      validator: (arr: IAction[]) => arr.length <= 10,
      message: 'Maximum 10 actions per agenda item'
    }
  },
  SupportingDocuments: [{ 
    type: Schema.Types.ObjectId,
    ref: 'Document'  // Reference to documents model
  }]
}, { _id: false });

// Main session agenda schema
const SessionAgendaSchema = new Schema<Agenda>({
  sessionId: { 
    type: Schema.Types.ObjectId,
    required: true,
    unique: true,
    ref: 'Session'  // Reference to session model
  },
  agendaItems: {
    type: [AgendaItemSchema],
    required: true,
    validate: [
      { 
        validator: (arr: IAgendaItem[]) => arr.length >= 1,
        message: 'At least one agenda item is required'
      },
      { 
        validator: (arr: IAgendaItem[]) => arr.length <= 20,
        message: 'Maximum 20 agenda items allowed'
      },
      { 
        validator: function(arr: IAgendaItem[]) {
          const orders = arr.map(item => item.Orden);
          return new Set(orders).size === orders.length;
        },
        message: 'Order values must be unique'
      }
    ]
  }
}, { timestamps: true });

// Create unique index
SessionAgendaSchema.index({ sessionId: 1 }, { unique: true });

export const SessionAgenda = model<Agenda>('SessionAgenda', SessionAgendaSchema);