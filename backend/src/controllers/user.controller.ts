// backend/src/controllers/user.controller.ts
import { RequestHandler, Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { UserModel, User } from '../models/user.model';
import dotenv from 'dotenv';

dotenv.config();
const JWT_SECRET: jwt.Secret = process.env.JWT_SECRET || 'please-set-a-secret-in-.env';
const JWT_EXPIRES_IN: SignOptions['expiresIn'] = (process.env.JWT_EXPIRES_IN as SignOptions['expiresIn']) || '2h';

/**
 * GET /api/users
 * List all users
 */
export const list: RequestHandler = async (req, res, next) => {
  try {
    const users = await UserModel.find().lean();
    res.json(users)
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/users/:id
 * Fetch one user by ID
 */
export const getOne: RequestHandler = async (req, res, next): Promise<void> => {
  const { id } = req.params
  try {
    const user = await UserModel.findById(id).lean()
    if (!user) {
      res.status(404).json({ message: 'User not found' })
      return
    }
    res.json(user)
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/users
 * Create a new user
 */
export const create: RequestHandler = async (req, res, next) => {
  try {
    const newUser = new UserModel(req.body)
    await newUser.save()
    res.status(201).json(newUser)
  } catch (err) {
    next(err)
  }
}

/**
 * PUT /api/users/:id
 * Update an existing user
 */
export const update: RequestHandler = async (req, res, next): Promise<void> => {
  const { id } = req.params
  try {
    const updated = await UserModel.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true
    }).lean()
    if (!updated) {
      res.status(404).json({ message: 'User not found' })
      return
    }
    res.json(updated)
    return
  } catch (err) {
    next(err)
    return
  }
}

/**
 * DELETE /api/users/:id
 * Remove a user
 */
export const remove: RequestHandler = async (req, res, next) => {
  const { id } = req.params
  try {
    const deleted = await UserModel.findByIdAndDelete(id).lean()
    if (!deleted) {
      res.status(404).json({ message: 'User not found' })
      return
    }
    res.status(204).end()
  } catch (err) {
    next(err)
  }
}

/**
 * Helper: sign a token with the user’s ID.
 */
const signToken = (user: User): string => {
  // jwt.sign accepts payload, secret, and an options object.
  return jwt.sign(
    { id: user._id, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * Register a new user.
 * POST /api/users/register
 * Body: { firstName, lastName, email, password, confirmPassword }
 */
export const register: RequestHandler = async (req, res, next) => {
  try {
    // 1) pull only what the front end sends
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
    } = req.body as {
      firstName: string
      lastName: string
      email: string
      password: string
      confirmPassword: string
    }

    // 2) Required fields
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      res.status(400).json({ message: 'All fields are required.' })
      return
    }

    // 3) Passwords must match
    if (password !== confirmPassword) {
      res.status(400).json({ message: 'Passwords do not match.' })
      return
    }

    // 4) Email uniqueness check
    const existing = await UserModel.findOne({ email })
    if (existing) {
      res.status(400).json({ message: 'Email already in use.' })
      return
    }

    // 5) Create the new user
    //    your schema now requires: firstName, lastName, email, tipoUsuario, position, organization, password
    //    defaulting tipoUsuario='USUARIO', position='Unassigned', organization='Unassigned'
    const newUser = new UserModel({
      firstName,
      lastName,
      email,
      tipoUsuario: 'USUARIO',
      position:    'Unassigned',
      organization:'Unassigned',
      password, // assume your schema has a pre-save hook to hash it
    })

    await newUser.save()

    // 6) Sign a JWT for the newly created user
    const token = signToken(newUser)

    // 7) Return the token and a safe user payload
    res.status(201).json({
      token,
      user: {
        _id:           newUser._id,
        firstName:     newUser.firstName,
        lastName:      newUser.lastName,
        email:         newUser.email,
        tipoUsuario:   newUser.tipoUsuario,
        position:      newUser.position,
        organization:  newUser.organization,
      },
    })
    return
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ message: 'Server error during registration.' })
    return
  }
}

/**
 * Log in an existing user.
 * POST /api/users/login
 * Body: { email, password }
 */
export const login: RequestHandler = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body as { email: string; password: string };

    // 1) Check required fields
    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required.' });
      return;
    }

    // 2) Find user by email
    const user = await UserModel.findOne({ email });
    if (!user) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    // 3) Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid email or password.' });
      return;
    }

    // 4) Sign a JWT
    const token = signToken(user);

    // 5) Return token + user info
    res.status(200).json({
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        position: user.position,
        organization: user.organization,
      },
    });
    return;
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login.' });
    return;
  }
};