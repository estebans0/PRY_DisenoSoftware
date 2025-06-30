// src/app/pages/sessions/session-view/session-visitor-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }   from '@angular/forms';
import { RouterModule }  from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { SessionService } from '../../../services/session.service';
import { AuthService    } from '../../../services/auth.service';

import { forkJoin, of }       from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';

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
    this.loading     = true;
    this.currentUser = this.authService.getCurrentUser();
    console.log('Current user:', this.currentUser);
    
    if (this.currentUser) {
      this.emailFilter = this.currentUser.email;
      this.nameFilter  = this.currentUser.firstName + ' ' + this.currentUser.lastName;
      console.log('emailFilter:', this.emailFilter);
      console.log('nameFilter:', this.nameFilter);
      this.search(); // Auto-search with user's data
    } else {
      this.loading = false;
    }
  }

  // for “presenter” tab
  getPresenterItems(session: any): any[] {
    if (!session.agenda || !Array.isArray(session.agenda)) {
      return [];
    }
    return session.agenda.filter((item: any) => item.presenter === this.nameFilter);
  }

  // NEW: only agenda-items where this user has at least one action
  getResponsibleItems(result: any): any[] {
    if (!Array.isArray(result.items)) return [];
    return result.items.filter((item: any) =>
      Array.isArray(item.actions) &&
      item.actions.some((a: any) => a.assignee.name === this.nameFilter)
    );
  }

  search() {
    if (!this.emailFilter && (this.viewType === 'presenter' || this.viewType === 'absent')) {
      return;
    }

    this.loading = true;
    this.currentResults = [];
    console.log(
      'search() called with viewType:', 
      this.viewType, 
      'nameFilter:', this.nameFilter, 
      'emailFilter:', this.emailFilter
    );

    switch (this.viewType) {
      case 'presenter':
        // 1) get IDs, 2) fetch full session, 3) attach sessionId for toggles
        this.sessionService.getSessionsByPresenter(this.nameFilter).pipe(
          switchMap((resp: any) => {
            const ids: string[] = Array.isArray(resp.data)
              ? resp.data.map((s: any) => s.sessionId)
              : [];
            const calls = ids.map((id: string) =>
              this.sessionService.getSession(id).pipe(
                catchError(err => {
                  console.error('error loading session', id, err);
                  return of(null);
                })
              )
            );
            return forkJoin(calls);
          })
        ).subscribe({
          next: (sessions: any[]) => {
            this.currentResults = sessions
              .filter((s): s is object => s != null)
              .map(s => ({ ...s, sessionId: (s as any)._id }));
            this.loading = false;
          },
          error: err => {
            console.error(err);
            this.loading = false;
          }
        });
        break;

      case 'responsible':
        this.sessionService.getResponsiblePoints(this.nameFilter).subscribe({
          next: (results) => {
            console.log('getResponsiblePoints result:', results);
            let data: any[] = [];
            if (results && typeof results === 'object' && 'data' in results && Array.isArray(results.data)) {
              data = results.data;
            } else if (Array.isArray(results)) {
              data = results;
            } else {
              data = Object.values(results);
            }
            // Transform to expected structure
            this.currentResults = data.map((item: any) => ({
              session: {
                sessionId:     item.sessionId,       // for toggling & routing
                sessionNumber: item.sessionNumber,
                date:          item.date,
                status:        item.status,
                type:          item.type,
                location:      item.location,
                modality:      item.modality,
                quorum:        item.quorum
              },
              items: item.agendaItems || []
            }));
            this.loading = false;
          },
          error: (err) => {
            console.error(err);
            this.loading = false;
          }
        });
        break;

      case 'absent':
        this.sessionService.getAbsentSessions(this.emailFilter).subscribe({
          next: (sessions) => {
            console.log('getAbsentSessions result:', sessions);
            this.currentResults = Array.isArray(sessions) ? sessions : Object.values(sessions);
            this.loading = false;
          },
          error: (err) => {
            console.error(err);
            this.loading = false;
          }
        });
        break;
    }
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
    if (!s.status || typeof s.status !== 'string') {
      return 'Pending';
    }
    if (s.status.toLowerCase() === 'scheduled') {
      return 'Pending';
    }
    return s.quorum || 'Pending';
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

  getSessionDetailsForUser(session: any): any {
    if (this.viewType === 'presenter') {
      return {
        type: 'presenter',
        items: this.getPresenterItems(session)
      };
    } else if (this.viewType === 'responsible') {
      return {
        type: 'responsible',
        items: session.items || []
      };
    }
    return { type: 'unknown', items: [] };
  }
}
