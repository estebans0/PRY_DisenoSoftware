// frontend/src/app/services/auth.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';

export interface UserPayload {
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
  position?: string;
  organization?: string;
}

export interface AuthResponse {
  token: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    position: string;
    organization: string;
    // any other fields…
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private base = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient, private router: Router) {}

  /**
   * Register a new user.
   * Expects the backend to create a user and return { token, user }.
   */
  register(payload: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
    position: string;
    tipoUsuario: string; // Default to 'USUARIO'
  }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/register`, payload)
      .pipe(
        tap(res => {
          // store JWT & user info
          localStorage.setItem('auth_token', res.token);
          localStorage.setItem('current_user', JSON.stringify(res.user));
        })
      );
  }

  /**
   * Log in an existing user.
   * Expects the backend to return { token, user }.
   */
  login(payload: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/login`, payload)
      .pipe(
        tap(res => {
          localStorage.setItem('auth_token', res.token);
          localStorage.setItem('current_user', JSON.stringify(res.user));
        })
      );
  }

  /**
   * Clear token + user, then redirect to /login.
   */
  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    this.router.navigate(['/login']);
  }

  /**
   * Returns true if a token is currently stored.
   */
  isLoggedIn(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  getCurrentUser(): any {
    const raw = localStorage.getItem('current_user');
    return raw ? JSON.parse(raw) : null;
  }
}
