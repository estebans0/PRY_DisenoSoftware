// backend/src/controllers/session.controller.ts
import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

import { Session } from '../models/session.model';

// ——— Setup ———
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
export const upload = multer({ storage: multer.memoryStorage() });

// Validate a MongoDB ObjectId
function isValidObjectId(id: string): boolean {
  return Types.ObjectId.isValid(id) && new Types.ObjectId(id).toString() === id;
}

// ——— CRUD ———

// GET /sessions
export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const sessions = await Session.find();
    res.json(sessions);
  } catch (err) {
    next(err);
  }
}

// POST /sessions
export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { _id, __v, ...data } = req.body;
    // set defaults
    data.status = data.status || 'Scheduled';
    data.quorum = data.quorum || 'Pending';

    const session = new Session(data);
    const saved = await session.save();
    res.status(201).json(saved);
  } catch (err) {
    next(err);
  }
}

// GET /sessions/:id
export async function getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ message: 'Invalid session ID' });
      return;
    }
    const sess = await Session.findById(req.params.id);
    if (!sess) {
      res.sendStatus(404);
      return;
    }
    res.json(sess);
  } catch (err) {
    next(err);
  }
}

// PUT /sessions/:id
export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const updated = await Session.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true, context: 'query' }
    );
    if (!updated) {
      res.sendStatus(404);
      return;
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

// DELETE /sessions/:id
export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ message: 'Invalid session ID' });
      return;
    }
    const result = await Session.findByIdAndDelete(req.params.id);
    result ? res.sendStatus(204) : res.sendStatus(404);
  } catch (err) {
    next(err);
  }
}

// POST /sessions/:id/start
export async function startSession(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const session = await Session.findByIdAndUpdate(
      req.params.id,
      { status: 'In Progress', startTime: new Date() },
      { new: true, runValidators: true, context: 'query' }
    );
    if (!session) {
      res.sendStatus(404);
      return;
    }
    res.json(session);
  } catch (err) {
    next(err);
  }
}

function sanitizeAgenda(rawAgenda: any[]): any[] {
  return rawAgenda.map(item => ({
    order:         item.order,
    title:         item.title,
    duration:      item.duration,
    presenter:     item.presenter,
    estimatedTime: item.estimatedTime,
    pro:           item.pro,
    against:       item.against,
    abstained:     item.abstained,
    notes:         item.notes || '', 
    actions:       (item.actions || []).map((a: any) => ({
                     description: a.description,
                     assignee:    { name: a.assignee.name },
                     dueDate:     a.dueDate
                   })),
    documents:     item.documents || [],
    decision:      item.decision || null
  }));
}

// — POST /sessions/:id/end —
export async function endSession(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sanitized = sanitizeAgenda(req.body.agenda || []);
    const session = await Session.findByIdAndUpdate(
      req.params.id,
      {
        status:    'Completed',
        endTime:   new Date(),
        agenda:    sanitized
      },
      { new: true, runValidators: true, context: 'query' }
    );
    if (!session) {
      res.sendStatus(404);
      return;
    }
    res.json(session);
  } catch (err) {
    next(err);
  }
}

// ——— Agenda Items by ID ———

// POST /sessions/:id/agenda
export async function addAgendaItems(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      res.status(400).json({ message: 'Invalid session ID' });
      return;
    }
    const session: any = await Session.findById(id);
    if (!session) {
      res.status(404).json({ message: 'Session not found' });
      return;
    }
    session.agenda.push(...req.body.agenda);
    await session.save();
    res.json(session);
  } catch (err) {
    next(err);
  }
}

// — PUT /sessions/:id/agenda —
export async function updateAgenda(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!isValidObjectId(req.params.id)) {
      res.status(400).json({ message: 'Invalid session ID' });
      return;
    }
    const session: any = await Session.findById(req.params.id);
    if (!session) {
      res.sendStatus(404);
      return;
    }
    session.agenda = sanitizeAgenda(req.body.agenda || []);
    await session.save();
    res.json(session);
  } catch (err) {
    next(err);
  }
}

// DELETE /sessions/:sessionId/agenda/:itemId
export async function removeAgendaItem(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { sessionId, itemId } = req.params;
    if (!isValidObjectId(sessionId) || !isValidObjectId(itemId)) {
      res.status(400).json({ message: 'Invalid ID' });
      return;
    }
    const session: any = await Session.findById(sessionId);
    if (!session) {
      res.status(404).json({ message: 'Session not found' });
      return;
    }
    session.agenda = session.agenda.filter((ai: any) => ai._id.toString() !== itemId);
    await session.save();
    res.json(session);
  } catch (err) {
    next(err);
  }
}

// ——— Agenda Items by Number ———

// GET /sessions/number/:number
export async function getOneByNumber(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const session = await Session.findOne({ number: req.params.number });
    if (!session) {
      res.status(404).json({ message: 'Session not found' });
      return;
    }
    res.json(session);
  } catch (err) {
    next(err);
  }
}

// PUT /sessions/number/:number
export async function updateByNumber(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const session = await Session.findOneAndUpdate(
      { number: req.params.number },
      req.body,
      { new: true, runValidators: true, context: 'query' }
    );
    if (!session) {
      res.status(404).json({ message: 'Session not found' });
      return;
    }
    res.json(session);
  } catch (err) {
    next(err);
  }
}

// DELETE /sessions/number/:number
export async function removeByNumber(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sessionNumber = req.params.number;
    const session      = await Session.findOne({ number: sessionNumber });
    if (!session) {
      res.status(404).json({ message: 'Session not found' });
      return;
    }
    const result = await Session.findOneAndDelete({ number: sessionNumber });
    result ? res.sendStatus(204) : res.status(500).json({ message: 'Error deleting session' });
  } catch (err) {
    next(err);
  }
}

// POST /sessions/number/:number/agenda
export async function addAgendaItemsByNumber(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const session: any = await Session.findOne({ number: req.params.number });
    if (!session) {
      res.status(404).json({ message: 'Session not found' });
      return;
    }
    session.agenda.push(...req.body.agenda);
    await session.save();
    res.json(session);
  } catch (err) {
    next(err);
  }
}

// PUT /sessions/number/:number/agenda
export async function updateAgendaByNumber(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const session: any = await Session.findOne({ number: req.params.number });
    if (!session) {
      res.status(404).json({ message: 'Session not found' });
      return;
    }
    session.agenda = req.body.agenda;
    await session.save();
    res.json(session);
  } catch (err) {
    next(err);
  }
}

// DELETE /sessions/number/:number/agenda/:itemId
export async function removeAgendaItemByNumber(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const session: any = await Session.findOne({ number: req.params.number });
    if (!session) {
      res.status(404).json({ message: 'Session not found' });
      return;
    }
    session.agenda = session.agenda.filter((ai: any) => ai._id.toString() !== req.params.itemId);
    await session.save();
    res.json(session);
  } catch (err) {
    next(err);
  }
}

// ——— Guests ———

// POST /sessions/:sessionId/guests
export async function addGuest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const session: any = await Session.findById(req.params.sessionId);
    if (!session) {
      res.status(404).json({ message: 'Session not found' });
      return;
    }
    const { name, email } = req.body;
    if (!email) {
      res.status(400).json({ message: 'Guest email is required' });
      return;
    }
    const newGuest = { id: session.guests.length + 1, name, email };
    session.guests.push(newGuest);
    await session.save();
    res.json(session);
  } catch (err) {
    next(err);
  }
}

// DELETE /sessions/:sessionId/guests/:guestId
export async function removeGuest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const session: any = await Session.findById(req.params.sessionId);
    if (!session) {
      res.status(404).json({ message: 'Session not found' });
      return;
    }
    session.guests = session.guests.filter((g: any) => g.id !== Number(req.params.guestId));
    await session.save();
    res.json(session);
  } catch (err) {
    next(err);
  }
}

// ——— Upload multiple PDFs per agenda item ———

// POST /sessions/:id/agenda/:order/documents
export const uploadDocuments = [
  upload.array('files'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id, order } = req.params;
      if (!isValidObjectId(id)) {
        res.status(400).json({ message: 'Invalid session ID' });
        return;
      }
      const session: any = await Session.findById(id);
      if (!session) {
        res.sendStatus(404);
        return;
      }
      const item: any = session.agenda.find((ai: any) => ai.Orden === +order);
      if (!item) {
        res.status(404).json({ message: 'Agenda item not found' });
        return;
      }

      const docs = (req.files as Express.Multer.File[]).map(file => {
        if (path.extname(file.originalname).toLowerCase() !== '.pdf') {
          throw new Error('Only PDF files are allowed');
        }
        const fname = `${session.number}-agenda${order}-${Date.now()}-${file.originalname}`;
        const fpath = path.join(uploadDir, fname);
        fs.writeFileSync(fpath, file.buffer);

        const doc = {
          fileName:   file.originalname,
          fileType:   file.mimetype,
          fileSize:   file.size,
          filePath:   fname,
          uploadDate: new Date()
        };
        item.SupportingDocuments = item.SupportingDocuments || [];
        item.SupportingDocuments.push(doc);
        return doc;
      });

      await session.save();
      res.json(docs);
    } catch (err) {
      next(err);
    }
  }
];
