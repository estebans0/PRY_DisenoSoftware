// src/controllers/session.controller.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';
import * as SessionService from '../services/session.service';
import { ObjectId } from 'mongodb';

// Helper for validating ObjectIDs
const isValidObjectId = (id: string) => ObjectId.isValid(id) && new ObjectId(id).toString() === id;


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

export const create: RequestHandler = async (req, res, next) => {
  try {
    // Strip server-generated fields
    const { _id, NumeroSession, ...sessionData } = req.body;
    
    const newSession = await SessionService.createSession({
      ...sessionData,
      SessionAttendees: sessionData.SessionAttendees?.map((a: any) => ({
        Attendee: new ObjectId(a.Attendee),
        Asistio: a.Asistio || false
      }))
    });
    
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
 // Matias Leer
export const startSession: RequestHandler = async (req, res, next) => {
  try {
    const session = await SessionService.startSession(req.params.id);
    if (!session) {
      res.sendStatus(404);
      return;
    }
    res.json(session);
  } catch (err) {
    next(err);
  }
};

export const endSession: RequestHandler = async (req, res, next) => {
  try {
    const { agenda } = req.body;
    const session = await SessionService.endSession(req.params.id, agenda);
    if (!session) {
      res.sendStatus(404);
      return;
    }
    res.json(session);
  } catch (err) {
    next(err);
  }
};

/** Agregar un invitado a una sesión */
export const addGuest: RequestHandler = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { name, email } = req.body;

    if (!name || !email) {
      res.status(400).json({ message: "Guest name and email are required" });
      return;
    }

    const updatedSession = await SessionService.addGuestToSession(sessionId, { name, email });
    
    res.json(updatedSession);
  } catch (err) {
    next(err);
  }
};

export const removeGuest: RequestHandler = async (req, res, next) => {
  try {
    const { sessionId, guestId } = req.params;
    const updatedSession = await SessionService.removeGuestFromSession(sessionId, Number(guestId));
    res.json(updatedSession);
  } catch (err) {
    next(err);
  }
};
