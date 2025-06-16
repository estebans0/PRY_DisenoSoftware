import { Request, Response, NextFunction, RequestHandler } from 'express';
import * as SessionService from '../services/session.service';
import { ObjectId } from 'mongodb';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Session } from '../models/session.model'; // Import Session model

// Helper for validating ObjectIDs
const isValidObjectId = (id: string) => ObjectId.isValid(id) && new ObjectId(id).toString() === id;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// annotate each export as a RequestHandler
export const list: RequestHandler = async (req, res, next) => {
  try {
    const sessions = await SessionService.getAllSessions();
    res.json(sessions);
    return;
  } catch (err) {
    next(err);
  }
};

// Add agenda items to a session
export const addAgendaItems: RequestHandler = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ message: 'Invalid session ID' });
      return;
    }

    // Check if session exists
    const session = await SessionService.getSessionById(req.params.id);
    if (!session) {
      res.status(404).json({ message: 'Session not found' });
      return;
    }

    // Add or update agenda items
    const updatedSession = await SessionService.addAgendaItems(req.params.id, req.body.agenda);
    res.json(updatedSession);
  } catch (err) {
    next(err);
  }
};

// Replace all agenda items in a session
export const updateAgenda: RequestHandler = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ message: 'Invalid session ID' });
      return;
    }

    // Check if session exists
    const session = await SessionService.getSessionById(req.params.id);
    if (!session) {
      res.status(404).json({ message: 'Session not found' });
      return;
    }

    // Update agenda items
    const updatedSession = await SessionService.updateAgenda(req.params.id, req.body.agenda);
    res.json(updatedSession);
  } catch (err) {
    next(err);
  }
};

// Delete an agenda item from a session
export const removeAgendaItem: RequestHandler = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.sessionId) || !isValidObjectId(req.params.itemId)) {
      res.status(400).json({ message: 'Invalid ID' });
      return;
    }

    const updatedSession = await SessionService.removeAgendaItem(req.params.sessionId, req.params.itemId);
    if (!updatedSession) {
      res.status(404).json({ message: 'Session or agenda item not found' });
      return;
    }

    res.json(updatedSession);
  } catch (err) {
    next(err);
  }
};

export const create: RequestHandler = async (req, res, next) => {
  try {
    // Strip server-generated fields
    const { _id, SessionID, ...sessionData } = req.body;
    
    // Process attendees if they exist
    const processedData = {
      ...sessionData,
      attendees: sessionData.attendees?.map((a: any) => ({
        memberId: a.memberId,
        status: a.status,
        role: a.role
      }))
    };
    
    // Create the session (agenda will be included if provided)
    const newSession = await SessionService.createSession(processedData);
    
    res.status(201).json(newSession);
  } catch (err) {
    next(err);
  }
};

export const getOne: RequestHandler = async (req, res, next) => {
  try {
    const sess = await SessionService.getSessionById(req.params.id);
    if (!sess) {
      res.sendStatus(404);
      return;
    }
    res.json(sess);
    return;
  } catch (err) {
    next(err);
  }
};

export const update: RequestHandler = async (req, res, next) => {
  try {
    const updatedSess = await SessionService.updateSession(req.params.id, req.body);
    if (!updatedSess) {
      res.sendStatus(404);
      return;
    }
    res.json(updatedSess);
    return;
  } catch (err) {
    next(err);
  }
};

export const remove: RequestHandler = async (req, res, next) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ message: 'Invalid session ID' });
      return;
    }

    const success = await SessionService.deleteSession(req.params.id);
    success ? res.sendStatus(204) : res.sendStatus(404);
  } catch (err) {
    next(err);
  }
};

// Get session by number
export const getOneByNumber: RequestHandler = async (req, res, next) => {
  try {
    const session = await SessionService.getSessionByNumber(req.params.number);
    if (!session) {
      res.status(404).json({ message: 'Session not found' });
      return;
    }
    res.json(session);
  } catch (err) {
    next(err);
  }
};

// Update session by number
export const updateByNumber: RequestHandler = async (req, res, next) => {
  try {
    const { _id, SessionID, ...updates } = req.body;
    const session = await SessionService.updateSessionByNumber(req.params.number, updates);
    if (!session) {
      res.status(404).json({ message: 'Session not found' });
      return;
    }
    res.json(session);
  } catch (err) {
    next(err);
  }
};

// Delete session by number
export const removeByNumber: RequestHandler = async (req, res, next) => {
  try {
    const sessionNumber = req.params.number;
    
    // First check if the session exists
    const session = await SessionService.getSessionByNumber(sessionNumber);
    if (!session) {
      res.status(404).json({ message: 'Session not found' });
      return;
    }
    
    // Delete the session
    const success = await SessionService.deleteSessionByNumber(sessionNumber);
    if (success) {
      res.sendStatus(204); // No Content - successful deletion
    } else {
      res.status(500).json({ message: 'Error deleting session' });
    }
  } catch (err) {
    next(err);
  }
};

// Add agenda items by session number
export const addAgendaItemsByNumber: RequestHandler = async (req, res, next) => {
  try {
    const sessionNumber = req.params.number;
    
    // Check if session exists
    const session = await SessionService.getSessionByNumber(sessionNumber);
    if (!session) {
      res.status(404).json({ message: 'Session not found' });
      return;
    }
    
    // Add agenda items
    const updatedSession = await SessionService.addAgendaItemsByNumber(
      sessionNumber, 
      req.body.agenda
    );
    
    res.json(updatedSession);
  } catch (err) {
    next(err);
  }
};

// Update agenda by session number
export const updateAgendaByNumber: RequestHandler = async (req, res, next) => {
  try {
    const sessionNumber = req.params.number;
    
    // Check if session exists
    const session = await SessionService.getSessionByNumber(sessionNumber);
    if (!session) {
      res.status(404).json({ message: 'Session not found' });
      return;
    }

    // Update agenda
    const updatedSession = await SessionService.updateAgendaItemsByNumber(
      sessionNumber, 
      req.body.agenda
    );
    res.json(updatedSession);
  } catch (err) {
    next(err);
  }
};

// Remove agenda item from session by number
export const removeAgendaItemByNumber: RequestHandler = async (req, res, next) => {
  try {
    const sessionNumber = req.params.number;
    const agendaItemId = req.params.itemId;
    
    // Check if session exists
    const session = await SessionService.getSessionByNumber(sessionNumber);
    if (!session) {
      res.status(404).json({ message: 'Session not found' });
      return;
    }

    // Remove agenda item
    const updatedSession = await SessionService.removeAgendaItemByNumber(
      sessionNumber,
      agendaItemId
    );
    res.json(updatedSession);
  } catch (err) {
    next(err);
  }
};
