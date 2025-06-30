// backend/src/controllers/user.controller.ts
import { RequestHandler } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { UserModel, User } from '../models/user.model';
import dotenv from 'dotenv';
import { JDMemberAdapter } from '../adapters/JDMemberAdapter';

dotenv.config();
const JWT_SECRET: jwt.Secret =
  process.env.JWT_SECRET || 'please-set-a-secret-in-.env';
const JWT_EXPIRES_IN: SignOptions['expiresIn'] =
  (process.env.JWT_EXPIRES_IN as SignOptions['expiresIn']) || '2h';

// Helper to sign tokens
const signToken = (user: User): string =>
  jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });


export const list: RequestHandler = async (_req, res, next) => {
  try {
    const users = await UserModel.find().lean();
    res.json(users);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/users/:id
 * Get a specific user by ID
 */
export const getOne: RequestHandler = async (req, res, next) => {
  try {
    const user = await UserModel.findOne({ email: req.params.email }).lean();
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/users
 * Create a new user
 */
export const create: RequestHandler = async (req, res, next) => {
  try {
    // schema defaults: status→Active, tipoUsuario→JDMEMBER, position→Unassigned
    const newUser = new UserModel({ ...req.body });
    await newUser.save();
    
    // Use the adapter to create a JDMember if applicable
    if (newUser.tipoUsuario === 'JDMEMBER') {
      await JDMemberAdapter.adaptUser(newUser);
    }
    
    res.status(201).json(newUser);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/users/:id
 * Update an existing user
 */
export const update: RequestHandler = async (req, res, next) => {
  try {
    // Store the original email before updating
    const originalEmail = req.params.email;
    
    const updated = await UserModel.findOneAndUpdate(
      { email: originalEmail },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!updated) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    // Use the adapter to update JDMember if applicable
    // Pass the original email so the adapter can find the existing JDMember record
    if (updated.tipoUsuario === 'JDMEMBER') {
      await JDMemberAdapter.adaptUser(updated, originalEmail);
    }
    
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/users/:id
 * Remove a user
 */
export const remove: RequestHandler = async (req, res, next) => {
  try {
    const user = await UserModel.findOne({ email: req.params.email });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    // Use adapter to remove JDMember if applicable
    await JDMemberAdapter.removeJDMember(user);
    
    // Now delete the user
    await UserModel.findOneAndDelete({ email: req.params.email });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/users/register
 * Register a new user (defaults to JDMEMBER type)
 */
export const register: RequestHandler = async (req, res) => {
  try {
    const { firstName, lastName, email, password, confirmPassword, tipoUsuario, position } =
      req.body as {
        firstName: string;
        lastName: string;
        email: string;
        password: string;
        confirmPassword: string;
        tipoUsuario?: 'ADMINISTRADOR' | 'JDMEMBER';
        position?: string;
      };

    // 1) Required
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      res.status(400).json({ message: 'All fields are required.' });
      return;
    }

    // 2) Password match
    if (password !== confirmPassword) {
      res.status(400).json({ message: 'Passwords do not match.' });
      return;
    }

    // 3) Unique email
    if (await UserModel.findOne({ email })) {
      res.status(400).json({ message: 'Email already in use.' });
      return;
    }

    // 4) Create with defaults from schema
    const newUser = new UserModel({
      firstName,
      lastName,
      email,
      password,
      tipoUsuario: tipoUsuario || 'JDMEMBER', // Default from schema is JDMEMBER
      position: position || 'Unassigned',     // Default from schema
      // status: 'Active' // Default from schema
    });
    
    // 5) Save user
    await newUser.save();
    
    // Use the adapter if applicable
    if (newUser.tipoUsuario === 'JDMEMBER') {
      await JDMemberAdapter.adaptUser(newUser);
    }

    // 6) Sign token & return
    const token = signToken(newUser);
    res.status(201).json({
      token,
      user: {
        _id: newUser._id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        tipoUsuario: newUser.tipoUsuario,
        position: newUser.position,
        status: newUser.status
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error during registration.' });
  }
};

/**
 * POST /api/users/login
 * User login
 */
export const login: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body as {
      email: string;
      password: string;
    };

    // 1) Required
    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required.' });
      return;
    }

    // 2) Lookup
    const user = await UserModel.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    // Inactive user check
    if (user.status === 'Inactive') {
      res.status(403).json({ message: 'Your account is inactive. Please contact your administrator.' });
      return;
    }

    // 3) Sign & return
    const token = signToken(user);
    res.json({
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        tipoUsuario: user.tipoUsuario,
        position: user.position,
        status: user.status
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login.' });
  }
};
