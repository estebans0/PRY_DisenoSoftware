import { Schema, model, Document, ObjectId } from 'mongoose';


export interface JDMember extends Document {
    firstName: string;
    lastName: string;
    email: string;
    position: string;
}

const jdMemberSchema = new Schema<JDMember>(
    {
        firstName: { type: String, required: true, trim: true },
        lastName: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        position: { type: String, required: true, trim: true }
    }
);


export const JDMemberModel = model<JDMember>('JDMember', jdMemberSchema);