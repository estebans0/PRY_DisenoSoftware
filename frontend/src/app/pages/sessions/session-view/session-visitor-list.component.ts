// src/app/pages/sessions/session-visitor-list/session-visitor-list.component.ts
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
    console.log('Current user:', this.currentUser);
    
    if (this.currentUser) {
      this.emailFilter = this.currentUser.email;
      this.nameFilter = this.currentUser.firstName + ' ' + this.currentUser.lastName;
      console.log('emailFilter:', this.emailFilter);
      console.log('nameFilter:', this.nameFilter);
      this.search(); // Auto-search with user's data
    } else {
      this.loading = false;
    }
  }

  // Get presenter items for the current session
  getPresenterItems(session: any): any[] {
    if (!session.agenda || !Array.isArray(session.agenda)) {
      return [];
    }
    // Since we already filtered in search(), just return all agenda items for this session
    return session.agenda;
  }

  // Get responsible items for the current session
  getResponsibleItems(session: any): any[] {
    if (!session.agenda || !Array.isArray(session.agenda)) {
      return [];
    }
    // Since we already filtered in search(), just return all agenda items for this session
    return session.agenda;
  }

  search() {
    if (!this.currentUser) {
      return;
    }

    this.loading = true;
    this.currentResults = [];
    console.log('search() called with viewType:', this.viewType, 'nameFilter:', this.nameFilter, 'emailFilter:', this.emailFilter);

    // For both presenter and responsible, we'll fetch all sessions and filter on the frontend
    if (this.viewType === 'presenter' || this.viewType === 'responsible') {
      this.sessionService.getSessions().subscribe({
        next: (allSessions) => {
          console.log('All sessions retrieved:', allSessions);
          
          // Filter sessions that have agenda items where the user is presenter or responsible
          this.currentResults = allSessions
            .map(session => {
              let relevantItems: any[] = [];
              
              if (this.viewType === 'presenter') {
                // Find agenda items where user is presenter
                relevantItems = (session.agenda || []).filter((item: any) => 
                  item.presenter === this.nameFilter || 
                  item.presenter === `${this.currentUser.firstName} ${this.currentUser.lastName}`
                );
              } else if (this.viewType === 'responsible') {
                // Find agenda items where user has assigned actions
                relevantItems = (session.agenda || []).filter((item: any) => 
                  item.actions && Array.isArray(item.actions) && 
                  item.actions.some((action: any) => 
                    action.assignee?.name === this.nameFilter ||
                    action.assignee?.name === `${this.currentUser.firstName} ${this.currentUser.lastName}` ||
                    action.assignee === this.nameFilter ||
                    action.assignee === `${this.currentUser.firstName} ${this.currentUser.lastName}`
                  )
                );
              }

              // Return session with relevant items if any found
              if (relevantItems.length > 0) {
                return {
                  sessionId: session._id,
                  sessionNumber: session.number,
                  date: session.date,
                  time: session.time,
                  location: session.location,
                  modality: session.modality,
                  type: session.type,
                  status: session.status,
                  quorum: session.quorum,
                  agenda: relevantItems
                };
              }
              return null;
            })
            .filter(session => session !== null); // Remove null entries

          console.log('Filtered results:', this.currentResults);
          this.loading = false;
        },
        error: (err) => {
          console.error('Error fetching sessions:', err);
          this.loading = false;
        }
      });
    } else if (this.viewType === 'absent') {
      // For absent sessions, use the existing endpoint
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
    // Simplified quorum logic - adjust as needed
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