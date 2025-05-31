// src/controllers/session.controller.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';
import * as SessionService from '../services/session.service';

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
    const newSess = await SessionService.createSession(req.body);
    res.status(201).json(newSess);
    return;
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

// …and so on for update, delete, etc.
