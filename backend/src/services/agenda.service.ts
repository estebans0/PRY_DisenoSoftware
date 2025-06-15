import mongoose, { Types } from 'mongoose';
import { SessionAgenda } from '../models/agenda.model';

// Get full agenda for a session
export const getAgendaBySessionId = async (sessionId: string) => {
  // Get the agenda items first
  const agenda = await SessionAgenda.findOne({ 
    NumeroSession: new Types.ObjectId(sessionId) 
  });
  
  if (!agenda) return null;
  
  // Get all presenter emails from the agenda
  const presenterEmails = agenda.SessionAgenda.map(item => item.Presenter);
  
  // Find the presenters
  const presenters = await mongoose.model('User').find({
    email: { $in: presenterEmails }
  }, 'name apellidos email');
  
  // Create a lookup map for quick access
  const presenterMap = new Map();
  presenters.forEach(p => presenterMap.set(p.email, p));
  
  // Attach presenter data to the response
  const result = agenda.toObject();
  result.SessionAgenda = result.SessionAgenda.map(item => ({
    ...item,
    PresenterDetails: presenterMap.get(item.Presenter) || null
  }));
  
  return result;
};

// Create or update entire agenda
export const createOrUpdateAgenda = async (
  sessionId: Types.ObjectId,
  agendaItems: any[]
) => {
  return SessionAgenda.findOneAndUpdate(
    { NumeroSession: sessionId },
    { SessionAgenda: agendaItems },
    { upsert: true, new: true, runValidators: true }
  ).populate('SessionAgenda.Presenter');
};

// Add a new agenda item to existing agenda
export const addAgendaItem = async (
  sessionId: Types.ObjectId,
  newItem: any
) => {
  return SessionAgenda.findOneAndUpdate(
    { NumeroSession: sessionId },
    { $push: { SessionAgenda: newItem } },
    { new: true, runValidators: true }
  ).populate('SessionAgenda.Presenter');
};

// Update existing agenda item
export const updateAgendaItem = async (
  sessionId: Types.ObjectId,
  order: number,
  updates: any
) => {
  const updateObj: Record<string, any> = {};
  
  // Build dynamic update object
  for (const [key, value] of Object.entries(updates)) {
    updateObj[`SessionAgenda.$.${key}`] = value;
  }

  return SessionAgenda.findOneAndUpdate(
    { 
      NumeroSession: sessionId,
      'SessionAgenda.Orden': order 
    },
    { $set: updateObj },
    { new: true, runValidators: true }
  ).populate('SessionAgenda.Presenter');
};

// Delete an agenda item
export const deleteAgendaItem = async (
  sessionId: Types.ObjectId,
  order: number
) => {
  return SessionAgenda.findOneAndUpdate(
    { NumeroSession: sessionId },
    { $pull: { SessionAgenda: { Orden: order } } },
    { new: true, runValidators: true }
  ).populate('SessionAgenda.Presenter');
};

// Delete entire agenda
export const deleteAgenda = async (sessionId: Types.ObjectId) => {
  return SessionAgenda.findOneAndDelete({ NumeroSession: sessionId });
};


