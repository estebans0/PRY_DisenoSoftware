import { MessageBuilder, MessageData } from './MessageBuilder';

export class SessionEndBuilder extends MessageBuilder {
  constructor(data: MessageData) {
    super(data);
  }

  protected addRecipients(): void {
    this.msg.recipients = this.data.recipients;
  }

  protected addSubject(): void {
    const num = this.data.session.number;
    this.msg.subject = `Session #${num} Ended`;
  }

  protected addBody(): void {
    const s    = this.data.session;
    const when = s.endTime ? new Date(s.endTime) : new Date();
    this.msg.body =
      `Session #${s.number} was closed on ${when.toLocaleString()}.\n\n` +
      `— BoardFlow`;
  }

  protected addSessionNumber(): void {
    const s    = this.data.session;
    const when = s.endTime ? new Date(s.endTime) : new Date();

    this.msg.sessionNumber = s.number;
    this.msg.timestamp     = when;
    this.msg.createdAt     = when;
    this.msg.updatedAt     = when;
  }
}
