import fs from 'fs';
import path from 'path';
import { Session, ISession } from '../models/session.model';

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Get all sessions
export const getAllSessions = async () => {
  return await Session.find();
};

// Get session by ID
export const getSessionById = async (id: string) => {
  return await Session.findById(id);
};

// Create new session
export const createSession = async (sessionData: any) => {
  const session = new Session(sessionData);
  return await session.save();
};

// Update session
export const updateSession = async (id: string, updates: any) => {
  return await Session.findByIdAndUpdate(id, updates, { new: true });
};

// Delete session
export const deleteSession = async (id: string) => {
  const result = await Session.findByIdAndDelete(id);
  return !!result;
};

// Get session by number
export const getSessionByNumber = async (number: string) => {
  return await Session.findOne({ number });
};

// Update session by number
export const updateSessionByNumber = async (number: string, updates: any) => {
  return await Session.findOneAndUpdate({ number }, updates, { new: true });
};

// Delete session by number
export const deleteSessionByNumber = async (number: string): Promise<boolean> => {
  const result = await Session.findOneAndDelete({ number });
  return !!result;
};

// Add agenda items to a session by number
export const addAgendaItemsByNumber = async (number: string, agendaItems: any[]) => {
  return await Session.findOneAndUpdate(
    { number },
    { $push: { agenda: { $each: agendaItems } } },
    { new: true }
  );
};

// Update all agenda items in a session by number
export const updateAgendaItemsByNumber = async (number: string, agenda: any[]) => {
  return await Session.findOneAndUpdate(
    { number },
    { $set: { agenda: agenda } },
    { new: true }
  );
};

// Remove agenda item from a session by number
export const removeAgendaItemByNumber = async (number: string, agendaItemId: string) => {
  return await Session.findOneAndUpdate(
    { number },
    { $pull: { agenda: { _id: agendaItemId } } },
    { new: true }
  );
};

// Add agenda items to a session
export const addAgendaItems = async (sessionId: string, agendaItems: any[]) => {
  return await Session.findByIdAndUpdate(
    sessionId,
    { $push: { agenda: { $each: agendaItems } } },
    { new: true }
  );
};

// Update all agenda items in a session
export const updateAgenda = async (sessionId: string, agenda: any[]) => {
  return await Session.findByIdAndUpdate(
    sessionId,
    { $set: { agenda: agenda } },
    { new: true }
  );
};

// Remove an agenda item from a session
export const removeAgendaItem = async (sessionId: string, agendaItemId: string) => {
  return await Session.findByIdAndUpdate(
    sessionId,
    { $pull: { agenda: { _id: agendaItemId } } },
    { new: true }
  );
};

/**
 * Upload a document to an agenda item identified by session number and agenda order
 */
export const uploadDocument = async (
  sessionNumber: string,
  agendaOrden: number,
  file: Express.Multer.File
) => {
  // Find the session by number
  const session = await Session.findOne({ number: sessionNumber });
  if (!session) {
    throw new Error('Session not found');
  }
  
  // Find the agenda item by order number
  const agendaItem = session.agenda.find(item => item.Orden === agendaOrden);
  if (!agendaItem) {
    throw new Error('Agenda item not found');
  }
  
  // Create a unique filename
  const fileName = `${sessionNumber}-agenda${agendaOrden}-${Date.now()}-${file.originalname}`;
  const filePath = path.join(uploadsDir, fileName);
  
  // Write the file to disk
  fs.writeFileSync(filePath, file.buffer);
  
  // Create document object
  const document = {
    fileName: file.originalname,
    fileType: file.mimetype,
    fileSize: file.size,
    filePath: fileName, // Store only the filename, not full path
    uploadDate: new Date()
  };
  
  // Initialize SupportingDocuments array if it doesn't exist
  if (!agendaItem.SupportingDocuments) {
    agendaItem.SupportingDocuments = [];
  }
  
  // Add the document to the agenda item
  agendaItem.SupportingDocuments.push(document);
  
  // Save the session with the new document
  await session.save();
  
  return document;
};

/**
 * List all documents for an agenda item
 */
export const listDocuments = async (
  sessionNumber: string,
  agendaOrden: number
) => {
  // Find the session by number
  const session = await Session.findOne({ number: sessionNumber });
  if (!session) {
    throw new Error('Session not found');
  }
  
  // Find the agenda item by order number
  const agendaItem = session.agenda.find(item => item.Orden === agendaOrden);
  if (!agendaItem) {
    throw new Error('Agenda item not found');
  }
  
  // Return the documents list or empty array
  return agendaItem.SupportingDocuments || [];
};

/**
 * Get a single document by index
 */
export const getDocument = async (
  sessionNumber: string,
  agendaOrden: number,
  documentIndex: number
) => {
  // Find the session by number
  const session = await Session.findOne({ number: sessionNumber });
  if (!session) {
    throw new Error('Session not found');
  }
  
  // Find the agenda item by order number
  const agendaItem = session.agenda.find(item => item.Orden === agendaOrden);
  if (!agendaItem) {
    throw new Error('Agenda item not found');
  }
  
  // Check if the document exists
  if (!agendaItem.SupportingDocuments || documentIndex >= agendaItem.SupportingDocuments.length) {
    throw new Error('Document not found');
  }
  
  return agendaItem.SupportingDocuments[documentIndex];
};

/**
 * Delete a document
 */
export const deleteDocument = async (
  sessionNumber: string,
  agendaOrden: number,
  documentIndex: number
) => {
  // Find the session by number
  const session = await Session.findOne({ number: sessionNumber });
  if (!session) {
    throw new Error('Session not found');
  }
  
  // Find the agenda item by order number
  const agendaItem = session.agenda.find(item => item.Orden === agendaOrden);
  if (!agendaItem) {
    throw new Error('Agenda item not found');
  }
  
  // Check if the document exists
  if (!agendaItem.SupportingDocuments || documentIndex >= agendaItem.SupportingDocuments.length) {
    throw new Error('Document not found');
  }
  
  // Get document info
  const document = agendaItem.SupportingDocuments[documentIndex];
  
  // Delete the file from disk
  const filePath = path.join(uploadsDir, document.filePath);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  
  // Remove from array
  agendaItem.SupportingDocuments.splice(documentIndex, 1);
  
  // Save the session
  await session.save();
  
  return true;
};

/**
 * Update minute maker and signer
 */
export const updateMinutesInfo = async (
  sessionNumber: string,
  minuteMaker?: string,
  minuteSigner?: string
) => {
  // Find the session by number
  const session = await Session.findOne({ number: sessionNumber });
  if (!session) {
    throw new Error('Session not found');
  }
  
  // Update minute maker and signer if provided
  if (minuteMaker !== undefined) {
    session.minuteMaker = minuteMaker;
  }
  
  if (minuteSigner !== undefined) {
    session.minuteSigner = minuteSigner;
  }
  
  // Save the session
  await session.save();
  
  return {
    minuteMaker: session.minuteMaker,
    minuteSigner: session.minuteSigner
  };
};
