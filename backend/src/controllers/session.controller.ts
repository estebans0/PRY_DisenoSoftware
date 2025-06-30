// backend/src/controllers/session.controller.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { Types } from 'mongoose';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

import { Session } from '../models/session.model';
import { SessionQueryService } from '../services/services.visitor';
import { MessageObserver } from '../services/MessageObserver';

// —── Setup Observer ─────────────────────────────────────────
const messageObserver = new MessageObserver();

// —── Setup Multer upload storage ───────────────────────────────────────────────
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
export const upload = multer({ storage: multer.memoryStorage() });

// —── Helper for validating ObjectIDs ──────────────────────────────────────────
const { ObjectId } = Types;
function isValidObjectId(id: string): boolean {
  return ObjectId.isValid(id) && new ObjectId(id).toString() === id;
}

// instantiate your visitor-based query service
const queryService = new SessionQueryService();

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
    tipoPunto:     item.tipoPunto,
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

/**
 * POST /sessions/:id/end
 * Close the session, save the final agenda, AND fire assignment notices
 */
export const endSession: RequestHandler = async (req, res, next) => {
  try {
    // 1) sanitize + persist final agenda
    const sanitized = sanitizeAgenda(req.body.agenda || []);
    const session = await Session.findByIdAndUpdate(
      req.params.id,
      {
        status:  'Completed',
        endTime: new Date(),
        agenda:  sanitized
      },
      { new: true, runValidators: true, context: 'query' }
    );

    if (!session) {
      res.sendStatus(404);
      return;
    }

    // 2) automatically notify every 'fondo estrategia y desarrollo' assignee
    for (const item of session.agenda) {
      if (
        item.tipoPunto === 'fondo estrategia y desarrollo' &&
        Array.isArray(item.actions)
      ) {
        for (const action of item.actions) {
          // find the email for this assignee
          const attendee = session.attendees.find(a => a.name === action.assignee.name);
          const assigneeEmail = attendee?.email ?? action.assignee.name;

          await messageObserver.onAgendaAssignment(
            session,
            item.title,
            assigneeEmail
          );
        }
      }
    }

    // 3) return the updated session
    res.json(session);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /sessions/:id/notify
 * Send a meeting notice to all confirmed attendees + guests
 */
export async function notifySession(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const session: any = await Session.findById(req.params.id);
    if (!session) {
      res.status(404).json({ message: 'Session not found' });
      return;
    }

    const memberEmails = (session.attendees || [])
      .filter((a: any) => a.status === 'Confirmed')
      .map((a: any) => a.email);
    const guestEmails = (session.guests || [])
      .map((g: any) => g.email);

    const recipients = Array.from(new Set([...memberEmails, ...guestEmails]));
    if (recipients.length === 0) {
      res.status(400).json({ message: 'No confirmed attendees or guests to notify.' });
      return;
    }

    // fire off the observer
    await messageObserver.onMeetingNotice(session, recipients);

    res.json({ success: true, notified: recipients.length, recipients });
    return;
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
    // Auto‐notify for each "fondo estrategia y desarrollo" assignment
    session.agenda
      .filter((i: any) => i.tipoPunto === 'fondo estrategia y desarrollo')
      .forEach((item: any) => {
        (item.actions || []).forEach((a: any) => {
          messageObserver.onAgendaAssignment(session, item.title, a.assignee.name /*or email*/);
        });
      });
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
};

//controladores del visitor
export const getSessionsByPresenter: RequestHandler = async (req, res, next) => {
  try {
    const presenterName = req.params.presenterName;
    
    if (!presenterName) {
      res.status(400).json({ 
        success: false,
        message: 'Presenter name is required' 
      });
      return;
    }

    // Buscar sesiones usando aggregate
    const sessions = await queryService.getSessionsByPresenter(presenterName);

    if (sessions.length === 0) {
      res.status(404).json({
        success: true,
        message: 'No sessions found for this presenter',
        data: []
      });
      return;
    }

    // Formatear respuesta
    const response = {
      success: true,
      count: sessions.length,
      data: sessions.map(session => ({
        sessionId: session._id,
        sessionNumber: session.number,
        date: session.date,
        time: session.time,
        location: session.location,
        status: session.status,
        agendaItems: session.agenda.map(item => ({
          itemId: item._id,
          title: item.title,
          order: item.order,
          duration: item.duration
        }))
      }))
    };

    res.json(response);
  } catch (err) {
    next(err);
  }
};

export const getResponsiblePoints: RequestHandler = async (req, res, next) => {
  try {
    const memberName = req.params.memberName;
    
    if (!memberName) {
      res.status(400).json({ 
        success: false,
        message: 'Member name is required' 
      });
      return;
    }

    // Buscar puntos de agenda donde el miembro es responsable
    const results = await queryService.getResponsiblePoints(memberName);

    if (results.length === 0) {
      res.status(404).json({
        success: true,
        message: 'No agenda items found for this responsible member',
        data: []
      });
      return;
    }

    // Formatear respuesta
    const response = {
      success: true,
      count: results.length,
      data: results.map(result => ({
        sessionId: result.session._id,
        sessionNumber: result.session.number,
        date: result.session.date,
        agendaItems: result.items.map(item => ({
          itemId: item._id,
          title: item.title,
          presenter: item.presenter,
          actions: item.actions.map(action => ({
            actionId: action._id,
            description: action.description,
            dueDate: action.dueDate
          }))
        }))
      }))
    };

    res.json(response);
  } catch (err) {
    next(err);
  }
};

export const getAbsentSessions: RequestHandler = async (req, res, next) => {
  try {
    const { memberEmail } = req.params;
    
    if (!memberEmail) {
      res.status(400).json({ message: 'Member email is required' });
      return;
    }

    const sessions = await queryService.getAbsentSessions(memberEmail);
    res.json(sessions);
  } catch (err) {
    next(err);
  }
};

export const getSessionsInDateRange: RequestHandler = async (req, res, next) => {
  try {
    const { start, end } = req.query;
    
    if (!start || !end) {
      res.status(400).json({ 
        message: 'Both start and end dates are required as query parameters' 
      });
      return;
    }

    const startDate = new Date(start as string);
    const endDate = new Date(end as string);
    
    if (isNaN(startDate.getTime())) {
      res.status(400).json({ message: 'Invalid start date format' });
      return;
    }
    
    if (isNaN(endDate.getTime())) {
      res.status(400).json({ message: 'Invalid end date format' });
      return;
    }

    const sessions = await queryService.getSessionsInDateRange(startDate, endDate);
    res.json(sessions);
  } catch (err) {
    next(err);
  }
};

export const getSessionDetailsById: RequestHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!isValidObjectId(id)) {
      res.status(400).json({ message: 'Invalid session ID' });
      return;
    }

    const session = await queryService.getSessionById(id);
    
    if (!session) {
      res.status(404).json({ message: 'Session not found' });
      return;
    }
    
    res.json(session);
  } catch (err) {
    next(err);
  }
};

// Controlador para filtrar actas donde el usuario es expositor o responsable
export const getFilteredMinutes: RequestHandler = async (req, res, next) => {
  try {
    const { memberEmail } = req.params;
    const { filterType } = req.query; // 'presenter' o 'responsible'
    
    if (!memberEmail) {
      res.status(400).json({ message: 'Member email is required' });
      return;
    }

    let results;
    
    if (filterType === 'presenter') {
      results = await queryService.getSessionsByPresenter(memberEmail);
    } else if (filterType === 'responsible') {
      results = await queryService.getResponsiblePoints(memberEmail);
    } else {
      res.status(400).json({ 
        message: 'Invalid filter type. Use "presenter" or "responsible"' 
      });
      return;
    }

    res.json(results);
  } catch (err) {
    next(err);
  }
};


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
