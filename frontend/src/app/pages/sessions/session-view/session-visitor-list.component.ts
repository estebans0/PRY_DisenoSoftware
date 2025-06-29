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

  // Add this method to your SessionVisitorListComponent class
    getPresenterItems(session: any): any[] {
      if (!session.agenda || !Array.isArray(session.agenda)) {
        return [];
      }
      return session.agenda.filter((item: any) => item.presenter === this.nameFilter);
  }

  search() {
    if (!this.emailFilter && (this.viewType === 'presenter' || this.viewType === 'absent')) {
      return;
    }
    /* if (!this.nameFilter && this.viewType === 'responsible') {
      return;
    } */

    this.loading = true;
    this.currentResults = [];
    console.log('search() called with viewType:', this.viewType, 'nameFilter:', this.nameFilter, 'emailFilter:', this.emailFilter);

    switch (this.viewType) {
      case 'presenter':
        this.sessionService.getSessionsByPresenter(this.nameFilter).subscribe({
          next: (sessions) => {
            console.log('getSessionsByPresenter result:', sessions);
            if (sessions && typeof sessions === 'object' && 'data' in sessions && Array.isArray(sessions.data)) {
              this.currentResults = sessions.data;
            } else if (Array.isArray(sessions)) {
              this.currentResults = sessions;
            } else {
              this.currentResults = Object.values(sessions);
            }
            this.loading = false;
          },
          error: (err) => {
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
            // Transform to expected structure for the template
            this.currentResults = data.map((item: any) => ({
              session: {
                sessionNumber: item.sessionNumber,
                date: item.date,
                status: item.status, // add if available
                // add other fields if needed
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
    // Simplified quorum logic - adjust as needed
    return s.quorum || 'Pending';
  }
}