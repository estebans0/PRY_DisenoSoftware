import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import * as AgendaService from '../services/agenda.service';

// Helper to validate MongoDB ObjectIds
const isValidObjectId = (id: string) => Types.ObjectId.isValid(id);

// Get agenda for a specific session
export const getAgenda = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;
    
    if (!isValidObjectId(sessionId)) {
      res.status(400).json({ message: 'Invalid session ID format' });
      return;
    }
    
    const agenda = await AgendaService.getAgendaBySessionId(sessionId);
    
    if (!agenda) {
      res.status(404).json({ message: 'No agenda found for this session' });
      return;
    }
    
    res.json(agenda);
  } catch (err) {
    next(err);
  }
};

// Create or update an entire agenda
export const createOrUpdateAgenda = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;
    const { SessionAgenda } = req.body; // Match the field name in your model
    
    if (!isValidObjectId(sessionId)) {
      res.status(400).json({ message: 'Invalid session ID format' });
      return;
    }
    
    if (!Array.isArray(SessionAgenda)) {
      res.status(400).json({ message: 'SessionAgenda must be an array' });
      return;
    }
    
    const result = await AgendaService.createOrUpdateAgenda(
      new Types.ObjectId(sessionId),
      SessionAgenda
    );
    
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

// Add a new item to an agenda
export const addAgendaItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;
    const newItem = req.body;
    
    if (!isValidObjectId(sessionId)) {
      res.status(400).json({ message: 'Invalid session ID format' });
      return;
    }
    
    // Basic validation for required fields
    if (!newItem.Titulo || newItem.Duration === undefined || !newItem.Presenter) {
      res.status(400).json({ 
        message: 'Missing required fields for agenda item' 
      });
      return;
    }
    
    // Determine the next order number if not provided
    if (newItem.Orden === undefined) {
      const agenda = await AgendaService.getAgendaBySessionId(sessionId);
      if (agenda && agenda.SessionAgenda && agenda.SessionAgenda.length > 0) {
        const maxOrder = Math.max(...agenda.SessionAgenda.map(item => item.Orden || 0));
        newItem.Orden = maxOrder + 1;
      } else {
        newItem.Orden = 1;
      }
    }
    
    const result = await AgendaService.addAgendaItem(
      new Types.ObjectId(sessionId),
      newItem
    );
    
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

// Update an existing agenda item
export const updateAgendaItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId, order } = req.params;
    const updates = req.body;
    
    if (!isValidObjectId(sessionId)) {
      res.status(400).json({ message: 'Invalid session ID format' });
      return;
    }
    
    if (isNaN(Number(order))) {
      res.status(400).json({ message: 'Order must be a number' });
      return;
    }
    
    const result = await AgendaService.updateAgendaItem(
      new Types.ObjectId(sessionId),
      Number(order),
      updates
    );
    
    if (!result) {
      res.status(404).json({ 
        message: 'Agenda or item not found' 
      });
      return;
    }
    
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// Delete an agenda item
export const deleteAgendaItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId, order } = req.params;
    
    if (!isValidObjectId(sessionId)) {
      res.status(400).json({ message: 'Invalid session ID format' });
      return;
    }
    
    if (isNaN(Number(order))) {
      res.status(400).json({ message: 'Order must be a number' });
      return;
    }
    
    const result = await AgendaService.deleteAgendaItem(
      new Types.ObjectId(sessionId),
      Number(order)
    );
    
    if (!result) {
      res.status(404).json({ 
        message: 'Agenda or item not found' 
      });
      return;
    }
    
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// Delete entire agenda
export const deleteAgenda = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;
    
    if (!isValidObjectId(sessionId)) {
      res.status(400).json({ message: 'Invalid session ID format' });
      return;
    }
    
    const result = await AgendaService.deleteAgenda(new Types.ObjectId(sessionId));
    
    if (!result) {
      res.status(404).json({ message: 'Agenda not found' });
      return;
    }
    
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};