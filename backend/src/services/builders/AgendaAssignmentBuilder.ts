// backend/src/services/builders/AgendaAssignmentBuilder.ts
import { MessageBuilder, MessageData } from './MessageBuilder';

export interface AgendaAssignmentData extends MessageData {
  pointTitle: string;
}

export class AgendaAssignmentBuilder extends MessageBuilder {
  constructor(protected data: AgendaAssignmentData) { super(data); }

  protected addRecipients(): void {
    this.msg.recipients = this.data.recipients;
  }

  protected addSubject(): void {
    this.msg.subject =
      `New Strategy Point Assigned (Session #${this.data.session.number})`;
  }

  protected addBody(): void {
    const s = this.data.session;
    this.msg.body =
      `You’ve been assigned to present “${this.data.pointTitle}” in ` +
      `session #${s.number} on ${new Date(s.date).toLocaleString()}.\n\n` +
      `— BoardFlow`;
  }

  protected addSessionNumber(): void {
    this.msg.sessionNumber = this.data.session.number;
    const s = this.data.session;
    const when = s.startTime ? new Date(s.startTime) : new Date(s.date);

    // same timestamp override:
    this.msg.timestamp = when;
    this.msg.createdAt = when;
    this.msg.updatedAt = when;
  }
}
