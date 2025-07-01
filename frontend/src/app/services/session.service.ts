// src/app/services/session.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpRequest, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Session {
  _id?: string;
  number: string;
  type: 'Ordinary' | 'Extraordinary';
  date:   string;
  time:   string;
  status: string; // 'Scheduled', 'in-progress', 'completed', 'cancelled'
  quorum: string; // 'Pending', 'Achieved', 'Not Achieved'
  attendees?: any[];
  guests?: any[];
  agenda?: any[];
  location: string;
  modality?: 'In Person' | 'Virtual' | 'Hybrid';
  description?: string;
  createdBy?: { _id: string; name: string };
  createdAt?: string;
  documents?: {
    fileName:   string;
    fileType?:  string;
    fileSize:   number;
    filePath:   string;
    uploadDate: string;
  }[];
  startTime?: string;
  endTime?:   string;
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private base = `${environment.apiUrl}/sessions`;

  constructor(private http: HttpClient) {}

  // — Core CRUD
  getSessions(): Observable<Session[]> {
    return this.http.get<Session[]>(this.base);
  }
  getSession(sessionId: string): Observable<Session> {
    return this.http.get<Session>(`${this.base}/${sessionId}`);
  }
  createSession(session: any): Observable<Session> {
    return this.http.post<Session>(this.base, session);
  }
  updateSession(sessionId: string, updates: any): Observable<Session> {
    return this.http.put<Session>(`${this.base}/${sessionId}`, updates);
  }
  deleteSession(sessionId: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${sessionId}`);
  }

  // — Start / End
  startSession(sessionId: string): Observable<Session> {
    return this.http.post<Session>(`${this.base}/${sessionId}/start`, {});
  }
  endSession(sessionId: string): Observable<Session> {
    return this.http.post<Session>(`${this.base}/${sessionId}/end`, {});
  }

  // — Guests
  addGuest(sessionId: string, guest: { name: string; email: string }): Observable<Session> {
    return this.http.post<Session>(`${this.base}/${sessionId}/guests`, guest);
  }
  removeGuest(sessionId: string, guestId: number): Observable<Session> {
    return this.http.delete<Session>(`${this.base}/${sessionId}/guests/${guestId}`);
  }

  // — Upload PDF(s) to a specific agenda item
  //
  //   POST /sessions/:id/agenda/:order/documents
  //   FormData field name = "files"
  uploadAgendaDocuments(
    sessionId: string,
    order: number,
    files: File[]
  ): Observable<HttpEvent<{}>> {
    const url = `${this.base}/${sessionId}/agenda/${order}/documents`;
    const form = new FormData();
    files.forEach(f => form.append('files', f, f.name));

    // Return a raw HttpRequest so the caller can track progress if desired:
    const req = new HttpRequest('POST', url, form, {
      reportProgress: true
    });
    return this.http.request(req);
  }

  uploadDocuments(sessionId: string, agendaOrden: number, form: FormData) {
    return this.http.post<any[]>(
      `${this.base}/${sessionId}/agenda/${agendaOrden}/documents`,
      form
    );
  }
//Cosas que se necesitan para el visitor
  /** Get all sessions where the user is a presenter. */
  getSessionsByPresenter(email: string): Observable<Session[]> {
    return this.http.get<Session[]>(`${this.base}/presenter/${email}`);
  }
  /** Get all sessions where the user is responsible for a point. */
  getResponsiblePoints(name: string): Observable<{ session: any; items: any[] }[]> {
    return this.http.get<{ session: any; items: any[] }[]>(
      `${this.base}/responsible/${encodeURIComponent(name)}`
    );
  }
  /** Get all sessions where the user is absent. */
  getAbsentSessions(email: string): Observable<Session[]> {
    return this.http.get<Session[]>(`${this.base}/absent/${email}`);
  }


  /** Update the agenda array on the session. */
  updateAgenda(sessionId: string, agenda: any[]): Observable<Session> {
    return this.http.put<Session>(
      `${this.base}/${sessionId}/agenda`,
      { agenda }
    );
  }

  /** Send a meeting notice to confirmed attendees + guests */
  notifySession(sessionId: string): Observable<{
    success:   boolean;
    notified:  number;
    recipients: string[];
  }> {
    return this.http.post<{
      success:   boolean;
      notified:  number;
      recipients: string[];
    }>(`${this.base}/${sessionId}/notify`, {});
  }
}
