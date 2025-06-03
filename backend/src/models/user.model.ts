// backend/src/models/user.model.ts

import { Schema, model, Document, ObjectId } from 'mongoose';
import bcrypt from 'bcrypt';

// 1) Create an interface representing a document in MongoDB
export interface User extends Document {
  userID: ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  tipoUsuario: 'ADMINISTRADOR' | 'USUARIO';
  organization: string;
  password: string;

  // Instance method to compare plaintext vs hashed password
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// 2) Define the Schema for User
const userSchema = new Schema<User>(
  {
    userID: { type: Schema.Types.ObjectId, auto: true },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    tipoUsuario: {
    type: String,
    required: true,
    enum: {
      values: ['ADMINISTRADOR', 'USUARIO'],
    }
  },
    position: {
      type: String,
      required: true,
      trim: true,
    },
    organization: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true, // Optional: adds createdAt / updatedAt
  }
);

// 3) Before saving, hash the password if it’s new or modified
userSchema.pre<User>('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(this.password, salt);
    this.password = hash;
    next();
  } catch (err) {
    next(err as any);
  }
});

// 4) Instance method to compare a plaintext password to the stored hash
userSchema.methods.comparePassword = async function (candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password);
};

// 5) Create and export the Mongoose model
export const UserModel = model<User>('User', userSchema);
