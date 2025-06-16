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

  // filters
  searchQuery = '';
  statusFilter: 'all' | 'scheduled' | 'in progress' | 'completed' | 'cancelled' = 'all';
  typeFilter:   'all' | 'ordinary' | 'extraordinary' = 'all';

  // delete‐dialog state
  isDeleteOpen  = false;
  selectedId: string | null = null;

  // quorum logic
  totalMembers = 0;
  quorumPercentage = 0;

  constructor(
    private sessionsSvc: SessionService,
    private settingsSvc: SettingsService,
    private memberSvc: MemberService
  ) {}

  ngOnInit() {
    this.loading = true;
    forkJoin({
      sessions: this.sessionsSvc.list(),
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

  get filteredSessions(): Session[] {
    const q = this.searchQuery.toLowerCase();
    return this.sessions.filter(s => {
      const matchesSearch =
        s.number.toLowerCase().includes(q) ||
        s.type.toLowerCase().includes(q) ||
        s.date.includes(this.searchQuery);
      const matchesStatus =
        this.statusFilter === 'all' ||
        s.status.toLowerCase() === this.statusFilter;
      const matchesType =
        this.typeFilter === 'all' ||
        s.type.toLowerCase() === this.typeFilter;
      return matchesSearch && matchesStatus && matchesType;
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
    this.sessionsSvc.delete(this.selectedId).subscribe({
      next: () => {
        this.isDeleteOpen = false;
        this.reload();
      },
      error: console.error
    });
  }
  private reload() {
    this.loading = true;
    this.sessionsSvc.list().subscribe({
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
    // count attendees array length
    const actual = Array.isArray(s.attendees) ? s.attendees.length : 0;
    const required = Math.ceil(this.totalMembers * this.quorumPercentage / 100);
    return actual >= required ? 'Achieved' : 'Not Achieved';
  }
}
