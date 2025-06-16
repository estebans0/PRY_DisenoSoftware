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

/** Agregar un invitado a una sesión */
export const addGuestToSession = async (sessionId: string, guest: { name: string; email: string }) => {
  const session = await Session.findById(sessionId);
  if (!session) throw new Error('Session not found');

  const newGuest = { id: session.guests.length + 1, name: guest.name, email: guest.email };
  session.guests.push(newGuest);
  await session.save();
  return session;
};

/** Eliminar un invitado de una sesión */
export const removeGuestFromSession = async (sessionId: string, guestId: number) => {
  const session = await Session.findById(sessionId);
  if (!session) throw new Error('Session not found');

  session.guests = session.guests.filter(g => g.id !== guestId);
  await session.save();
  return session;
};

};

