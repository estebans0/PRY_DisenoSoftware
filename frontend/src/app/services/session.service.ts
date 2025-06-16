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

  list(): Observable<Session[]> {
    return this.http.get<Session[]>(this.base);
  }

  get(id: string): Observable<Session> {
    return this.http.get<Session>(`${this.base}/${id}`);
  }

  create(data: Partial<Session>): Observable<Session> {
    return this.http.post<Session>(this.base, data);
  }

  update(id: string, data: Partial<Session>): Observable<Session> {
    return this.http.put<Session>(`${this.base}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
