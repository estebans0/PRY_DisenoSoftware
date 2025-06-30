import { Mensaje } from '../../models/mensaje.model';

export interface MessageData {
  session: any;
  recipients: string[];
}

export abstract class MessageBuilder {
  protected msg: Partial<Mensaje> = {
    sender:    'SYSTEM',
    timestamp: new Date(),
    read:      false
  };

  constructor(protected data: MessageData) {}

  /** Template Method — do NOT override */
  public build(): Partial<Mensaje> {
    this.addRecipients();
    this.addSubject();
    this.addBody();
    this.addSessionNumber();
    return this.msg;
  }

  protected abstract addRecipients(): void;
  protected abstract addSubject():   void;
  protected abstract addBody():      void;
  protected abstract addSessionNumber(): void;
}
