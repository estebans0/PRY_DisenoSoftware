// frontend/src/app/services/message.service.ts
import { Injectable } from '@angular/core';
import { HttpClient }   from '@angular/common/http';
import { Observable }   from 'rxjs';
import { environment }  from '../../environments/environment';

export interface Mensaje {
  _id: string;
  sender: string;
  recipients: string[];
  subject: string;
  body: string;
  sessionNumber: string;
  timestamp: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class MessageService {
  private base = `${environment.apiUrl}/messages`;

  /** GET /messages?email=foo@bar.com */
  list(email: string): Observable<Mensaje[]> {
    return this.http.get<Mensaje[]>(`${this.base}?email=${encodeURIComponent(email)}`);
  }

  /** PATCH /messages/:id/read */
  markRead(id: string): Observable<Mensaje> {
    return this.http.patch<Mensaje>(`${this.base}/${id}/read`, {});
  }

  /** DELETE /messages/:id */
  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  /** DELETE /messages?email=foo@bar.com */
  clearInbox(email: string): Observable<void> {
    return this.http.delete<void>(`${this.base}?email=${encodeURIComponent(email)}`);
  }

  constructor(private http: HttpClient) {}
}
