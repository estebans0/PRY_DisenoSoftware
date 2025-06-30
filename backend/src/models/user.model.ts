// backend/src/models/user.model.ts
import { Schema, model, Document, ObjectId } from 'mongoose';
import bcrypt from 'bcrypt';

// 1) Create an interface representing a document in MongoDB
export interface User extends Document {
  userID: ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  tipoUsuario: 'ADMINISTRADOR' | 'JDMEMBER'; //Actualizado segun especificacion
  position: string;
  password: string;
  status: 'Active' | 'Inactive';

  // Instance method to compare plaintext vs hashed password
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// 2) Define the Schema for User
const userSchema = new Schema<User>(
  {
    userID: { type: Schema.Types.ObjectId, auto: true },

    firstName:     { type: String, required: true, trim: true },
    lastName:      { type: String, required: true, trim: true },
    email:         { type: String, required: true, unique: true, lowercase: true, trim: true },

    tipoUsuario:   {
      type:     String,
      required: true,
      enum:     { values: ['ADMINISTRADOR', 'JDMEMBER'] },
      default:  'JDMEMBER'
    },

    position:      { type: String, required: true, trim: true, default: 'Board member' },

    password:      { type: String, required: true },

    status:        {
      type:     String,
      required: true,
      enum:     { values: ['Active','Inactive'] },
      default:  'Active'
    },
  },
  { timestamps: true } // adds createdAt / updatedAt
);

// 3) Hash password
userSchema.pre<User>('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err as any);
  }
});

// 4) Compare method
userSchema.methods.comparePassword = async function (candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password);
};

// 5) Export
export const UserModel = model<User>('User', userSchema);
