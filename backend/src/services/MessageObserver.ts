import { MensajeModel } from '../models/mensaje.model';
import { MessageData } from './builders/MessageBuilder';
import { MeetingNoticeBuilder } from './builders/MeetingNoticeBuilder';
import { AgendaAssignmentBuilder, AgendaAssignmentData } from './builders/AgendaAssignmentBuilder';
import { SessionStartBuilder } from './builders/SessionStartBuilder';
import { SessionEndBuilder } from './builders/SessionEndBuilder';

export class MessageObserver {
  /** Send the meeting notice (“invitation”) */
  async onMeetingNotice(session: any, recipients: string[]) {
    const data: MessageData = { session, recipients };
    const payload = new MeetingNoticeBuilder(data).build();
    await MensajeModel.create(payload);
  }

  /** Send an assignment‐of‐agenda‐point notice */
  async onAgendaAssignment(
    session: any,
    pointTitle: string,
    assigneeEmail: string,
    agendaOrder: number
  ) {
    const data: AgendaAssignmentData = {
      session,
      recipients: [assigneeEmail],
      pointTitle,
      agendaOrder
    };
    const payload = new AgendaAssignmentBuilder(data).build();
    await MensajeModel.create(payload);
  }

  /** Send a “session started” notification */
  async onSessionStart(session: any, recipients: string[]) {
    const data: MessageData = { session, recipients };
    const payload = new SessionStartBuilder(data).build();
    await MensajeModel.create(payload);
  }

  /** Send a “session ended” notification */
  async onSessionEnd(session: any, recipients: string[]) {
    const data: MessageData = { session, recipients };
    const payload = new SessionEndBuilder(data).build();
    await MensajeModel.create(payload);
  }
}
