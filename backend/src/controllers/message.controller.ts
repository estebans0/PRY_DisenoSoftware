import { Request, Response, NextFunction } from 'express';
import { MensajeModel } from '../models/mensaje.model';

/**
 * GET /messages?email=foo@bar.com
 * List inbox for a given MiembroJD email
 */
export async function listMessages(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const email = req.query.email as string;
    if (!email) {
      res.status(400).json({ message: 'Missing ?email= parameter' });
      return;
    }

    const inbox = await MensajeModel
      .find({ recipients: email })
      .sort({ timestamp: -1 });
    res.json(inbox);
    return;
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /messages/:id/read
 * Mark a single message as read
 */
export async function markRead(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const m = await MensajeModel.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    if (!m) {
      res.sendStatus(404);
      return;
    }
    res.json(m);
    return;
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /messages/:id
 * Delete a single message
 */
export async function deleteOne(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const d = await MensajeModel.findByIdAndDelete(req.params.id);
    d ? res.sendStatus(204) : res.sendStatus(404);
    return;
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /messages?email=foo@bar.com
 * Clear entire inbox for that address
 */
export async function clearInbox(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const email = req.query.email as string;
    if (!email) {
      res.status(400).json({ message: 'Missing ?email= parameter' });
      return;
    }
    await MensajeModel.deleteMany({ recipients: email });
    res.sendStatus(204);
    return;
  } catch (err) {
    next(err);
  }
}
