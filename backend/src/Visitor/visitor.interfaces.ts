import { Document } from 'mongoose';
import { ISession } from '../models/session.model';
import { IAgendaItem } from '../models/agenda.model';

// Interface para elementos visitables
export interface IVisitableSession {
    accept(visitor: ISessionVisitor): Promise<void>;
}

// Interface para el Visitor
export interface ISessionVisitor {
    visitSession(session: ISession & Document): Promise<void>;
    visitAgendaItem(item: IAgendaItem): Promise<void>;
    getResults(): any;
}