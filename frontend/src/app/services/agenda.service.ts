// frontend/src/app/services/agenda.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AgendaService {
  private base = `${environment.apiUrl}/agenda`;

  constructor(private http: HttpClient) {}

  getAgenda(sessionId: string): Observable<any> {
    return this.http.get<any>(`${this.base}/session/${sessionId}`);
  }

  createOrUpdateAgenda(sessionId: string, agenda: any): Observable<any> {
    return this.http.put<any>(`${this.base}/session/${sessionId}`, agenda);
  }

  addAgendaItem(sessionId: string, agendaItem: any): Observable<any> {
    return this.http.post<any>(`${this.base}/session/${sessionId}/item`, agendaItem);
  }

  updateAgendaItem(sessionId: string, order: number, updates: any): Observable<any> {
    return this.http.put<any>(`${this.base}/session/${sessionId}/item/${order}`, updates);
  }

  deleteAgendaItem(sessionId: string, order: number): Observable<any> {
    return this.http.delete<any>(`${this.base}/session/${sessionId}/item/${order}`);
  }
}