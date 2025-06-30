// backend/src/services/builders/MeetingNoticeBuilder.ts
import { MessageBuilder, MessageData } from './MessageBuilder';

export class MeetingNoticeBuilder extends MessageBuilder {
  constructor(data: MessageData) { super(data); }

  protected addRecipients(): void {
    this.msg.recipients = this.data.recipients;
  }

  protected addSubject(): void {
    this.msg.subject = `Meeting Notice: Session #${this.data.session.number}`;
  }

  protected addBody(): void {
    const s = this.data.session;
    this.msg.body =
      `Dear member,\n\n` +
      `You are invited to session #${s.number} on ${new Date(s.date).toLocaleString()}.\n\n` +
      `Please confirm your attendance.\n\n— BoardFlow`;
  }

  protected addSessionNumber(): void {
    const s = this.data.session;
    const when = s.startTime ? new Date(s.startTime) : new Date(s.date);

    this.msg.sessionNumber = s.number;
    this.msg.timestamp     = when;
    this.msg.createdAt     = when;
    this.msg.updatedAt     = when;
  }
}
