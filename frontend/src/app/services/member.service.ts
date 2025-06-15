// frontend/src/app/services/member.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Member {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  tipoUsuario: 'ADMINISTRADOR' | 'USUARIO';
  position: string;
  organization: string;
  status: 'Active' | 'Inactive';
}

@Injectable({ providedIn: 'root' })
export class MemberService {
  private base = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  list(): Observable<Member[]> {
    return this.http.get<Member[]>(this.base);
  }

  get(id: string): Observable<Member> {
    return this.http.get<Member>(`${this.base}/${id}`);
  }

  create(payload: Partial<Member> & { password: string }): Observable<Member> {
    return this.http.post<Member>(this.base, payload);
  }

  update(id: string, payload: Partial<Member>): Observable<Member> {
    return this.http.put<Member>(`${this.base}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
