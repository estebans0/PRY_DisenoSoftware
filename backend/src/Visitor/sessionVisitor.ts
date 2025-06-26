// visitors/sessionVisitors.ts

import { Types } from "mongoose";
import { IAgendaItem } from "../models/agenda.model";
import { ISession } from "../models/session.model";
import { ISessionVisitor } from "./visitor.interfaces";

export class SessionsByPresenterVisitor implements ISessionVisitor {
    private results: (ISession & Document)[] = [];
    private currentSession: ISession & Document | null = null;
    
    constructor(private readonly presenterEmail: string) {
        if (!presenterEmail) {
            throw new Error('Presenter email is required');
        }
    }

    async visitSession(session: ISession & Document): Promise<void> {
        this.currentSession = session;
        try {
            for (const item of session.agenda) {
                await this.visitAgendaItem(item);
            }
        } finally {
            this.currentSession = null; // Limpieza
        }
    }

    async visitAgendaItem(item: IAgendaItem): Promise<void> {
        if (!this.currentSession) {
            throw new Error('Session context not set');
        }

        // Comparación segura de IDs
        const isDuplicate = this.results.some(s => 
            (s._id as Types.ObjectId).equals(this.currentSession!._id as Types.ObjectId)
        );

        if (item.Presenter === this.presenterEmail && !isDuplicate) {
            this.results.push(this.currentSession);
        }
    }

    getResults(): (ISession & Document)[] {
        return [...this.results];
    }
}



export class ResponsiblePointsVisitor implements ISessionVisitor {
    private results: Array<{
        session: ISession & Document;
        items: IAgendaItem[];
    }> = [];
    
    constructor(private responsibleEmail: string) {}

    async visitSession(session: ISession & Document): Promise<void> {
        const responsibleItems = session.agenda.filter(item => 
            item.Actions?.some(action => action.Responsable === this.responsibleEmail)
        );
        
        if (responsibleItems.length > 0) {
            this.results.push({
                session,
                items: responsibleItems
            });
        }
    }

    async visitAgendaItem(item: IAgendaItem): Promise<void> {
        // No es necesario implementar aquí para este visitor
    }

    // Implementar el método getResults
    getResults(): Array<{
        session: ISession & Document;
        items: IAgendaItem[];
    }> {
        return this.results;
    }
}

export class AbsentSessionsVisitor implements ISessionVisitor {
    private results: (ISession & Document)[] = []; // Especifica el tipo de retorno
    
    constructor(private memberEmail: string) {}

    async visitSession(session: ISession & Document): Promise<void> {
        const isPresent = session.attendees.some(
            attendee => attendee.email === this.memberEmail && attendee.status === 'present'
        );
        
        if (!isPresent) {
            this.results.push(session);
        }
    }

    async visitAgendaItem(item: IAgendaItem): Promise<void> {
        // No es necesario para esta consulta
    }

    getResults(): (ISession & Document)[] { // Especifica el tipo de retorno
        return this.results;
    }
}