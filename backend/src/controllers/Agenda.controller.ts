import { Request, Response, NextFunction } from 'express';
import mongoose, { Types } from 'mongoose';
import * as AgendaService from '../services/agenda.service';
import { SessionAgenda } from '../models/agenda.model'; 
import { DocumentModel } from '../models/document.model'; // Import the Document model


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
    const { SessionAgenda } = req.body; 
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
    
    // Validacion
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

// Upload documents to an agenda item
export const uploadDocuments = async (req: Request, res: Response, next: NextFunction) => {
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

    // Process uploaded files
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ message: 'No files uploaded' });
      return;
    }
    
    // Create document references in database
    const documentIds = await Promise.all(files.map(async (file) => {
      // Use the DocumentModel directly instead of mongoose.model('Document')
      const doc = await DocumentModel.create({
        filename: file.originalname,
        path: file.path,
        mimetype: file.mimetype,
        size: file.size,
        uploadDate: new Date()
      });
      return doc._id;
    }));
    
    // Add document references to the agenda item
    const updateResult = await SessionAgenda.findOneAndUpdate(
      { 
        NumeroSession: new Types.ObjectId(sessionId),
        'SessionAgenda.Orden': Number(order)
      },
      { 
        $push: { 'SessionAgenda.$.SupportingDocuments': { $each: documentIds } } 
      },
      { new: true }
    );
    
    if (!updateResult) {
      res.status(404).json({ message: 'Agenda or item not found' });
      return;
    }
    
    res.json(updateResult);
  } catch (err) {
    next(err);
  }
};

// Delete a document from an agenda item
export const deleteDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId, order, docId } = req.params;
    
    if (!isValidObjectId(sessionId) || !isValidObjectId(docId)) {
      res.status(400).json({ message: 'Invalid ID format' });
      return;
    }
    
    if (isNaN(Number(order))) {
      res.status(400).json({ message: 'Order must be a number' });
      return;
    }
    
    const result = await AgendaService.removeDocumentFromAgendaItem(
      new Types.ObjectId(sessionId),
      Number(order),
      new Types.ObjectId(docId)
    );
    
    if (!result) {
      res.status(404).json({ message: 'Agenda item or document not found' });
      return;
    }
    
    res.json(result);
  } catch (err) {
    next(err);
  }
};