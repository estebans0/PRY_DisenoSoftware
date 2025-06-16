import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Settings {
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

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private base = `${environment.apiUrl}/settings`;

  constructor(private http: HttpClient) {}

  get(): Observable<Settings> {
    return this.http.get<Settings>(this.base);
  }

  update(data: Settings): Observable<Settings> {
    return this.http.put<Settings>(this.base, data);
  }
}
