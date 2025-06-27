import { Document, InferSchemaType } from 'mongoose';
import { ISession,AgendaItemSchema } from '../models/session.model';

// Extrae el tipo del esquema AgendaItemSchema
type AgendaItemType = InferSchemaType<typeof AgendaItemSchema>;

// Interface para elementos visitables
export interface IVisitableSession {
    accept(visitor: ISessionVisitor): Promise<void>;
}

// Interface para el Visitor
export interface ISessionVisitor {
    visitSession(session: ISession & Document): Promise<void>;
    visitAgendaItem(item: AgendaItemType): Promise<void>;
    getResults(): any;
}