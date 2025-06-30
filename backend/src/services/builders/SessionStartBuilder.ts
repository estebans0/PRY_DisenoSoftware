import { MessageBuilder, MessageData } from './MessageBuilder';

export class SessionStartBuilder extends MessageBuilder {
  constructor(data: MessageData) {
    super(data);
  }

  protected addRecipients(): void {
    this.msg.recipients = this.data.recipients;
  }

  protected addSubject(): void {
    const num = this.data.session.number;
    this.msg.subject = `Session #${num} Started`;
  }

  protected addBody(): void {
    const s    = this.data.session;
    const when = s.startTime ? new Date(s.startTime) : new Date();
    this.msg.body =
      `Session #${s.number} has just started on ${when.toLocaleString()}.\n\n` +
      `— BoardFlow`;
  }

  protected addSessionNumber(): void {
    const s    = this.data.session;
    const when = s.startTime ? new Date(s.startTime) : new Date();

    this.msg.sessionNumber = s.number;
    this.msg.timestamp     = when;
    this.msg.createdAt     = when;
    this.msg.updatedAt     = when;
  }
}
