import { Schema, model, Document } from 'mongoose';

export interface Settings extends Document {
  quorumPercentage: number;
  advanceNoticeDays: number;
  sessionSettings: {
    autoSendReminders: boolean;
    requireAttendanceConfirmation: boolean;
    allowVirtualAttendance: boolean;
    recordSessions: boolean;
    autoGenerateMinutes: boolean;
  };
  notifications: {
    sessionCreated: boolean;
    sessionReminder: boolean;
    minutesAvailable: boolean;
    taskAssigned: boolean;
    firstReminderDays: number;
    secondReminderDays: number;
  };
  templates: {
    meetingNotice: string;
    absenceJustification: string;
    minutesTemplate: string;
  };
}

const settingsSchema = new Schema<Settings>(
  {
    quorumPercentage: { type: Number, default: 50 },
    advanceNoticeDays: { type: Number, default: 7 },
    sessionSettings: {
      autoSendReminders: { type: Boolean, default: true },
      requireAttendanceConfirmation: { type: Boolean, default: true },
      allowVirtualAttendance: { type: Boolean, default: true },
      recordSessions: { type: Boolean, default: true },
      autoGenerateMinutes: { type: Boolean, default: true },
    },
    notifications: {
      sessionCreated: { type: Boolean, default: true },
      sessionReminder: { type: Boolean, default: true },
      minutesAvailable: { type: Boolean, default: true },
      taskAssigned: { type: Boolean, default: true },
      firstReminderDays: { type: Number, default: 7 },
      secondReminderDays: { type: Number, default: 1 },
    },
    templates: {
      meetingNotice: {
        type: String,
        default: `Dear [Member Name],\n\nWe are pleased to invite you to the upcoming board meeting:\n\nSession: [Session Number] - [Session Type]\nDate: [Date]\nTime: [Time]\nLocation: [Location/Link]\n\nPlease find the agenda attached.\n\nBest regards,\n[Organization Name]`,
      },
      absenceJustification: {
        type: String,
        default: `Dear [Organization Name],\n\nI regret to inform you that I will not be able to attend the upcoming board meeting scheduled for [Date] due to [Reason].\n\nBest regards,\n[Member Name]`,
      },
      minutesTemplate: {
        type: String,
        default: `MINUTES OF MEETING\n[Organization Name]\nBoard Meeting\n\nSession: [Session Number] - [Session Type]\nDate: [Date]\nTime: [Start Time] - [End Time]\nLocation: [Location/Link]\n\nATTENDEES:\n[List of Attendees]\n\nABSENT:\n[List of Absent Members]\n\nAGENDA ITEMS:\n[Agenda Items with Discussion, Decisions, and Action Items]\n\nNEXT MEETING:\n[Next Meeting Date and Time]\n\nMinutes prepared by: [Secretary Name]\nApproved by: [Chairperson Name]`,
      },
    },
  },
  { timestamps: true }
);

export const SettingsModel = model<Settings>('Settings', settingsSchema);
