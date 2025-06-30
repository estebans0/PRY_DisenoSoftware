import { MensajeModel } from '../models/mensaje.model';
import { MessageData }  from './builders/MessageBuilder';
import { MeetingNoticeBuilder } from './builders/MeetingNoticeBuilder';
import { AgendaAssignmentBuilder, AgendaAssignmentData }
  from './builders/AgendaAssignmentBuilder';

export class MessageObserver {
  async onMeetingNotice(session: any, recipients: string[]) {
    const data: MessageData = { session, recipients };
    const payload = new MeetingNoticeBuilder(data).build();
    await MensajeModel.create(payload);
  }

  async onAgendaAssignment(
    session: any,
    pointTitle: string,
    assigneeEmail: string
  ) {
    const data: AgendaAssignmentData = {
      session,
      recipients: [assigneeEmail],
      pointTitle
    };
    const payload = new AgendaAssignmentBuilder(data).build();
    await MensajeModel.create(payload);
  }
}
