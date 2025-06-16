// src/app/services/session.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Session {
  _id?: string;
  number: string;
  type: string;
  date:   string;
  time:   string;
  status: string; // 'scheduled', 'in progress', 'completed', 'cancelled'
  quorum: string;
  attendees?: string[];
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private base = `${environment.apiUrl}/sessions`;

  constructor(private http: HttpClient) {}

  // Get all sessions
  getSessions(): Observable<any[]> {
    return this.http.get<any[]>(this.base);
  }

  // Get a single session by ID
  getSession(sessionId: string): Observable<any> {
    return this.http.get<any>(`${this.base}/${sessionId}`);
  }

  // Create a new session
  createSession(session: any): Observable<any> {
    return this.http.post<any>(this.base, session);
  }

  // Update an existing session
  updateSession(sessionId: string, updates: any): Observable<any> {
    return this.http.put<any>(`${this.base}/${sessionId}`, updates);
  }

  // Delete a session
  deleteSession(sessionId: string): Observable<any> {
    return this.http.delete<any>(`${this.base}/${sessionId}`);
  }

  // Update attendee status (present/absent)
  updateAttendeeStatus(sessionId: string, attendeeId: string, attended: boolean): Observable<any> {
    return this.http.put<any>(`${this.base}/${sessionId}/attendees/${attendeeId}`, { Asistio: attended });
  }

  // Add attendee to session
  addAttendee(sessionId: string, attendeeId: string): Observable<any> {
    return this.http.post<any>(`${this.base}/${sessionId}/attendees`, { Attendee: attendeeId });
  }

  // Remove attendee from session
  removeAttendee(sessionId: string, attendeeId: string): Observable<any> {
    return this.http.delete<any>(`${this.base}/${sessionId}/attendees/${attendeeId}`);
  }
  startSession(sessionId: string): Observable<any> {
    return this.http.post(`${this.base}/${sessionId}/start`, {});
  }

  endSession(sessionId: string, agenda: any[]): Observable<any> {
    return this.http.post(`${this.base}/${sessionId}/end`, { agenda });
  }
}
