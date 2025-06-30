// backend/src/services/builders/AgendaAssignmentBuilder.ts

import { MessageBuilder, MessageData } from './MessageBuilder';

/** include the agenda item’s order (Z) */
export interface AgendaAssignmentData extends MessageData {
  pointTitle:   string;
  agendaOrder:  number;
}

export class AgendaAssignmentBuilder extends MessageBuilder {
  constructor(protected data: AgendaAssignmentData) {
    super(data);
  }

  protected addRecipients(): void {
    this.msg.recipients = this.data.recipients;
  }

  protected addSubject(): void {
    this.msg.subject =
      `New Strategy Point Assigned (Session #${this.data.session.number})`;
  }

  protected addBody(): void {
    const s    = this.data.session;
    const { pointTitle, agendaOrder } = this.data;
    // format the session date
    const dateStr = new Date(s.date).toLocaleDateString();
    this.msg.body =
      `En la sesión #${s.number} (fecha: ${dateStr}), se le asignó la responsabilidad de atender ` +
      `el punto #${agendaOrder} (“${pointTitle}”) de fondo estrategia y desarrollo.\n\n` +
      `— BoardFlow`;
  }

  protected addSessionNumber(): void {
    const s    = this.data.session;
    const when = s.startTime ? new Date(s.startTime) : new Date(s.date);
    this.msg.sessionNumber = s.number;
    this.msg.timestamp     = when;
    this.msg.createdAt     = when;
    this.msg.updatedAt     = when;
  }
}
