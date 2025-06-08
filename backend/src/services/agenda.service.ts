import { Types } from 'mongoose';
import { SessionAgenda, Agenda, IAgendaItem } from '../models/agenda.model';

// Get full agenda for a session
export const getAgendaBySessionId = async (sessionId: string) => {
  return SessionAgenda.findOne({ sessionId }).populate([
    { path: 'agendaItems.Presenter', select: 'name apellidos' },
    { path: 'agendaItems.SupportingDocuments' }
  ]);
};

// Create or update entire agenda
export const createOrUpdateAgenda = async (
  sessionId: Types.ObjectId,
  agendaItems: IAgendaItem[]
) => {
  return SessionAgenda.findOneAndUpdate(
    { sessionId },
    { agendaItems },
    { upsert: true, new: true, runValidators: true }
  ).populate('agendaItems.Presenter');
};

// Add a new agenda item to existing agenda
export const addAgendaItem = async (
  sessionId: Types.ObjectId,
  newItem: IAgendaItem
) => {
  return SessionAgenda.findOneAndUpdate(
    { sessionId },
    { $push: { agendaItems: newItem } },
    { new: true, runValidators: true }
  ).populate('agendaItems.Presenter');
};

// Update existing agenda item
export const updateAgendaItem = async (
  sessionId: Types.ObjectId,
  order: number,  // Using order as identifier since no _id in subdocuments
  updates: Partial<IAgendaItem>
) => {
  const updateObj: Record<string, any> = {};
  
  // Build dynamic update object
  for (const [key, value] of Object.entries(updates)) {
    updateObj[`agendaItems.$.${key}`] = value;
  }

  return SessionAgenda.findOneAndUpdate(
    { 
      sessionId,
      'agendaItems.Orden': order 
    },
    { $set: updateObj },
    { new: true, runValidators: true }
  ).populate('agendaItems.Presenter');
};

// Delete an agenda item
export const deleteAgendaItem = async (
  sessionId: Types.ObjectId,
  order: number
) => {
  return SessionAgenda.findOneAndUpdate(
    { sessionId },
    { $pull: { agendaItems: { Orden: order } } },
    { new: true, runValidators: true }
  ).populate('agendaItems.Presenter');
};

// Delete entire agenda
export const deleteAgenda = async (sessionId: Types.ObjectId) => {
  return SessionAgenda.findOneAndDelete({ sessionId });
};


