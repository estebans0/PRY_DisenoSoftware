// src/app/pages/sessions/session-list/session-list.component.ts
import { Component, OnInit }       from '@angular/core';
import { CommonModule }            from '@angular/common';
import { FormsModule }             from '@angular/forms';
import { RouterModule }            from '@angular/router';
import { LucideAngularModule }     from 'lucide-angular';
import { forkJoin }                from 'rxjs';

import { SessionService, Session } from '../../../services/session.service';
import { SettingsService }         from '../../../services/settings.service';
import { MemberService }           from '../../../services/member.service';
import { AuthService }             from '../../../services/auth.service';

@Component({
  selector: 'app-session-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    LucideAngularModule
  ],
  templateUrl: './session-list.component.html',
  styleUrls: ['./session-list.component.scss']
})
export class SessionListComponent implements OnInit {
  sessions: Session[] = [];
  loading = true;

  // text filters
  searchQuery = '';
  statusFilter: 'all' | 'scheduled' | 'in progress' | 'completed' | 'cancelled' = 'all';
  typeFilter:   'all' | 'ordinary' | 'extraordinary' = 'all';

  // date‐range filters
  fromDate: string = '';
  toDate:   string = '';

  // delete‐dialog state
  isDeleteOpen  = false;
  selectedId: string | null = null;

  // quorum logic
  totalMembers = 0;
  quorumPercentage = 0;

  constructor(
    private sessionsSvc: SessionService,
    private settingsSvc: SettingsService,
    private memberSvc: MemberService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loading = true;
    forkJoin({
      sessions: this.sessionsSvc.getSessions(),
      settings: this.settingsSvc.get(),
      members:  this.memberSvc.list()
    }).subscribe({
      next: ({ sessions, settings, members }) => {
        this.sessions = sessions;
        this.quorumPercentage = settings.quorumPercentage;
        this.totalMembers = members.length;
        this.loading = false;
      },
      error: err => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  /** Only Administrators can manage sessions */
  get isAdministrator(): boolean {
    const u = this.authService.getCurrentUser();
    return u?.tipoUsuario === 'ADMINISTRADOR';
  }

  /** JD Members can only view/report, but not edit/delete */
  get isJDMember(): boolean {
    const u = this.authService.getCurrentUser();
    return u?.tipoUsuario === 'JDMEMBER';
  }

  /**
   * Apply search, status, type and now date‐range ("fromDate" / "toDate") filters
   */
  get filteredSessions(): Session[] {
    const q = this.searchQuery.trim().toLowerCase();

    return this.sessions
      // 1) Search text match
      .filter(s => {
        const inText =
          s.number.toLowerCase().includes(q) ||
          s.type.toLowerCase().includes(q) ||
          s.date.includes(this.searchQuery);
        return inText;
      })
      // 2) Status
      .filter(s =>
        this.statusFilter === 'all' ||
        s.status.toLowerCase() === this.statusFilter
      )
      // 3) Type
      .filter(s =>
        this.typeFilter === 'all' ||
        s.type.toLowerCase() === this.typeFilter
      )
      // 4) From‐Date
      .filter(s => {
        if (!this.fromDate) return true;
        return new Date(s.date) >= new Date(this.fromDate);
      })
      // 5) To‐Date
      .filter(s => {
        if (!this.toDate) return true;
        // add one day so that selecting the same day includes it
        const to = new Date(this.toDate);
        to.setDate(to.getDate() + 1);
        return new Date(s.date) < to;
      });
  }

  badgeClass(status: string): string {
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

  openDelete(id: string) {
    this.selectedId   = id;
    this.isDeleteOpen = true;
  }
  cancelDelete() {
    this.isDeleteOpen = false;
    this.selectedId   = null;
  }
  doDelete() {
    if (!this.selectedId) return;
    this.sessionsSvc.deleteSession(this.selectedId).subscribe({
      next: () => {
        this.isDeleteOpen = false;
        this.reload();
      },
      error: console.error
    });
  }
  private reload() {
    this.loading = true;
    this.sessionsSvc.getSessions().subscribe({
      next: data => { this.sessions = data; this.loading = false; },
      error: () => this.loading = false
    });
  }

  /**
   * Quorum status:
   * - "Pending"   if still scheduled
   * - "Achieved"  if actual attendees ≥ required
   * - "Not Achieved" otherwise
   */
  getQuorumStatus(s: Session): 'Pending' | 'Achieved' | 'Not Achieved' {
    if (s.status.toLowerCase() === 'scheduled') {
      return 'Pending';
    }
    const actual   = Array.isArray(s.attendees) ? s.attendees.length : 0;
    const required = Math.ceil(this.totalMembers * this.quorumPercentage / 100);
    return actual >= required ? 'Achieved' : 'Not Achieved';
  }
}
