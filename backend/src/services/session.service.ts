import { Session, ISession } from '../models/session.model';

export const createSession = async (data: Partial<ISession>) => {
  const sess = new Session(data);
  return sess.save();
};

export const getAllSessions = () => Session.find().sort({ date: -1 });
export const getSessionById = (id: string) => Session.findById(id);
// add updateSession, deleteSession...
