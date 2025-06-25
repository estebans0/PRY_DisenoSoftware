import { RequestHandler } from 'express';
import { JDMemberModel } from '../models/JDMember.model';

/**
 * GET /api/jdmembers
 * List all JD members
 */
export const list: RequestHandler = async (_req, res, next) => {
  try {
    const members = await JDMemberModel.find().lean();
    res.json(members);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/jdmembers/:email
 * Get a specific JD member by email
 */
export const getOne: RequestHandler = async (req, res, next) => {
  try {
    const member = await JDMemberModel.findOne({ email: req.params.email }).lean();
    if (!member) {
      res.status(404).json({ message: 'JD Member not found' });
      return;
    }
    res.json(member);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/jdmembers
 * Create a new JD member directly (not through adapter)
 */
export const create: RequestHandler = async (req, res, next) => {
  console.log('JDMember create request body:', req.body);
  try {
    const newMember = new JDMemberModel({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      position: req.body.position
    });
    await newMember.save();
    res.status(201).json(newMember);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/jdmembers/:email
 * Update an existing JD member
 */
export const update: RequestHandler = async (req, res, next) => {
  try {
    const updated = await JDMemberModel.findOneAndUpdate(
      { email: req.params.email },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updated) {
      res.status(404).json({ message: 'JD Member not found' });
      return;
    }
    
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/jdmembers/:email
 * Remove a JD member
 */
export const remove: RequestHandler = async (req, res, next) => {
  try {
    const result = await JDMemberModel.findOneAndDelete({ email: req.params.email });
    
    // Add this code to handle the response properly
    if (!result) {
      res.status(404).json({ message: 'JD Member not found' });
      return;
    }
    
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};