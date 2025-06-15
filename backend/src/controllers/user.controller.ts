// backend/src/controllers/user.controller.ts
import { RequestHandler } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { UserModel, User } from '../models/user.model';
import dotenv from 'dotenv';

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

/**
 * GET /api/users
 */
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
 */
export const getOne: RequestHandler = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.params.id).lean();
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
 */
export const create: RequestHandler = async (req, res, next) => {
  try {
    // schema defaults status→Active, tipoUsuario, position, organization
    const newUser = new UserModel({ ...req.body });
    await newUser.save();
    res.status(201).json(newUser);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/users/:id
 */
export const update: RequestHandler = async (req, res, next) => {
  try {
    const updated = await UserModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).lean();
    if (!updated) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/users/:id
 */
export const remove: RequestHandler = async (req, res, next) => {
  try {
    const deleted = await UserModel.findByIdAndDelete(req.params.id).lean();
    if (!deleted) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/users/register
 */
export const register: RequestHandler = async (req, res) => {
  try {
    const { firstName, lastName, email, password, confirmPassword } =
      req.body as {
        firstName: string;
        lastName: string;
        email: string;
        password: string;
        confirmPassword: string;
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

    // 4) Create with default status = "Active"
    const newUser = new UserModel({
      firstName,
      lastName,
      email,
      password,
      // defaults: tipoUsuario='USUARIO', position/organization='Unassigned', status='Active'
    });
    await newUser.save();

    // 5) Sign token & return
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
        organization: newUser.organization,
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
        organization: user.organization,
        status: user.status
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login.' });
  }
};
