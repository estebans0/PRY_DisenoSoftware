// src/app/pages/sessions/session-view/session-visitor-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { SessionService } from '../../../services/session.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-session-visitor-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    LucideAngularModule
  ],
  templateUrl: './session-visitor-list.component.html',
  styleUrls: ['./session-visitor-list.component.scss']
})
export class SessionVisitorListComponent implements OnInit {
  // Data
  currentResults: any[] = [];
  loading = true;
  
  // Filters
  viewType: 'presenter' | 'responsible' | 'absent' = 'presenter';
  emailFilter = '';
  nameFilter = '';
  
  // Current user
  currentUser: any;

  /** track which session details are expanded */
  expandedSessionIds = new Set<string>();

  constructor(
    private sessionService: SessionService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loading = true;
    this.currentUser = this.authService.getCurrentUser();
    if (this.currentUser) {
      this.emailFilter = this.currentUser.email;
      this.nameFilter  = `${this.currentUser.firstName} ${this.currentUser.lastName}`;
      this.search(); // Auto‐search on load
    } else {
      this.loading = false;
    }
  }

  // Get presenter items for the current session
  getPresenterItems(session: any): any[] {
    if (!session.agenda || !Array.isArray(session.agenda)) {
      return [];
    }
    return session.agenda;
  }

  // Get responsible items for the current session (unused now)
  getResponsibleItems(session: any): any[] {
    if (!session.agenda || !Array.isArray(session.agenda)) {
      return [];
    }
    return session.agenda;
  }

  toggleSessionExpansion(sessionId: string) {
    if (this.expandedSessionIds.has(sessionId)) {
      this.expandedSessionIds.delete(sessionId);
    } else {
      this.expandedSessionIds.add(sessionId);
    }
  }

  isSessionExpanded(sessionId: string): boolean {
    return this.expandedSessionIds.has(sessionId);
  }

  badgeClass(status: string): string {
    if (!status) {
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
    switch (status.toLowerCase()) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'in progress':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  }

  getQuorumStatus(s: any): 'Pending' | 'Achieved' | 'Not Achieved' {
    if (!s.status || typeof s.status !== 'string') return 'Pending';
    if (s.status.toLowerCase() === 'scheduled') return 'Pending';
    return s.quorum || 'Pending';
  }

  /**
   * Main search routine: for 'presenter' and 'absent' we
   * still do exactly what you had.  For 'responsible'
   * we now call the backend visitor API.
   */
  search() {
    if (!this.currentUser) return;

    this.loading = true;
    this.currentResults = [];

    // — Presenter branch (unchanged) —
    if (this.viewType === 'presenter') {
      this.sessionService.getSessions().subscribe({
        next: (allSessions) => {
          this.currentResults = allSessions
            .map(session => {
              const relevantItems = (session.agenda || []).filter((item: any) =>
                item.presenter === this.nameFilter
              );
              if (relevantItems.length > 0) {
                return {
                  sessionId:     session._id,
                  sessionNumber: session.number,
                  date:          session.date,
                  time:          session.time,
                  location:      session.location,
                  modality:      session.modality,
                  type:          session.type,
                  status:        session.status,
                  quorum:        session.quorum,
                  agenda:        relevantItems
                };
              }
              return null;
            })
            .filter(s => s !== null);
          this.loading = false;
        },
        error: () => { this.loading = false; }
      });

    // — Responsible branch (NEW) —
    } else if (this.viewType === 'responsible') {
      this.sessionService.getResponsiblePoints(this.nameFilter).subscribe({
        next: (res: any) => {
          // the visitor‐controller returns { success, count, data: [...] }
          const hits = Array.isArray(res.data) ? res.data : [];
          this.currentResults = hits.map((r: any) => ({
            session: {
              sessionId:     r.sessionId,
              sessionNumber: r.sessionNumber,
              date:          r.date,
              time:          r.time,
              location:      r.location,
              modality:      r.modality,
              type:          r.type,
              status:        r.status,
              quorum:        r.quorum
            },
            items: r.items
          }));
          this.loading = false;
        },
        error: () => { this.loading = false; }
      });

    // — Absent branch (unchanged) —
    } else {
      this.sessionService.getAbsentSessions(this.emailFilter).subscribe({
        next: (sessions) => {
          this.currentResults = Array.isArray(sessions)
            ? sessions.map(s => ({
                sessionId:     s._id,
                sessionNumber: s.number,
                date:          s.date,
                time:          s.time,
                location:      s.location,
                modality:      s.modality,
                type:          s.type,
                status:        s.status,
                quorum:        s.quorum,
                agenda:        []
              }))
            : [];
          this.loading = false;
        },
        error: () => { this.loading = false; }
      });
    }
  }
}
