import { Session, ISession } from '../models/session.model';

export const createSession = async (data: Partial<ISession>) => {
  const sess = new Session(data);
  return sess.save();
};

export const getAllSessions = () => Session.find().sort({ date: -1 });
export const getSessionById = (id: string) => Session.findById(id);
export const updateSession = async (id: string, data: Partial<ISession>) => {
  return Session.findByIdAndUpdate(id, data, { new: true });
};
export const deleteSession = async (id: string) => {
  return Session.findByIdAndDelete(id);
};

// Nuevos métodos para manejar el estado de la sesión
export const startSession = async (id: string) => {
  return Session.findByIdAndUpdate(id, {
    status: 'in-progress',
    startTime: new Date()
  }, { new: true });
};

export const endSession = async (id: string, agendaItems: any[]) => {
  return Session.findByIdAndUpdate(id, {
    status: 'completed',
    endTime: new Date(),
    agenda: agendaItems
  }, { new: true });
};