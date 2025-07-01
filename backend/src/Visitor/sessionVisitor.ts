// visitors/sessionVisitors.ts

import { Document, Types } from "mongoose";
import { AgendaItemSchema, AgendaItemType, ISession } from "../models/session.model";
import { ISessionVisitor } from "./visitor.interfaces";

export class SessionsByPresenterVisitor implements ISessionVisitor {
    private results: (ISession & Document)[] = [];
    
    constructor(private readonly presenterName: string) {
        if (!presenterName) {
            throw new Error('Presenter name is required');
        }
    }

    async visitSession(session: ISession & Document): Promise<void> {
        // Convertimos la agenda a objetos planos si es necesario
        const agendaItems = session.agenda.map(item => 
            item instanceof Document ? item.toObject() : item
        );

        // Buscamos items donde el presenter coincida
        const hasMatchingItems = agendaItems.some(item => 
            item.presenter === this.presenterName
        );

        if (hasMatchingItems) {
            this.results.push(session);
        }
    }

    async visitAgendaItem(item: any): Promise<void> {
        // No es necesario implementar esto para este visitor
    }

    getResults(): (ISession & Document)[] {
        return [...this.results];
    }
}

/**
 * NEW: only picks up those
 * 'fondo estrategia y desarrollo' items
 * where item.responsible.name === responsibleName
 */
export class ResponsiblePointsVisitor implements ISessionVisitor {
  private results: Array<{
    session: ISession & Document;
    items: AgendaItemType[];
  }> = [];

  constructor(private responsibleName: string) {
    if (!responsibleName.trim()) {
      throw new Error("Valid responsible name is required");
    }
  }

  async visitSession(session: ISession & Document): Promise<void> {
    // Cast to the TS‐extracted type
    const agendaItems = session.agenda as AgendaItemType[];

    const responsibleItems = agendaItems.filter(item =>
      // only fondo‐type AND exactly this user
      item.tipoPunto === "fondo estrategia y desarrollo" &&
      item.responsible?.name === this.responsibleName
    );

    if (responsibleItems.length > 0) {
      this.results.push({ session, items: responsibleItems });
    }
  }

  async visitAgendaItem(_: any): Promise<void> {
    // Not needed here
  }

  getResults() {
    return this.results;
  }
}

export class AbsentSessionsVisitor implements ISessionVisitor {
    private results: (ISession & Document)[] = [];
    
    constructor(private memberEmail: string) {}

    async visitSession(session: ISession & Document): Promise<void> {
        // Convertir los attendees a objetos planos si son documentos Mongoose
        const attendees = session.attendees.map(attendee => 
            attendee instanceof Document ? attendee.toObject() : attendee
        );

        const isPresent = attendees.some(
            attendee => attendee.email === this.memberEmail && attendee.status === 'Confirmed'
        );
        
        if (!isPresent) {
            this.results.push(session);
        }
    }

    async visitAgendaItem(item: any): Promise<void> {
        // No necesario para este visitor
    }

    getResults(): (ISession & Document)[] {
        return this.results;
    }
}
