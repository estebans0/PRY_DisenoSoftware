// src/app/pages/dashboard/dashboard.component.ts
import { Component }           from '@angular/core';
import { CommonModule }        from '@angular/common';
import { RouterModule }        from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

interface Session {
  id: number;
  number: string;
  type: string;
  date: string;
  time: string;
  quorum: string;
  status?: string;
}

interface Alert {
  id: number;
  type: 'warning'|'info'|'success';
  message: string;
  date: string;
}

@Component({
  standalone: true,
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    RouterModule,
    LucideAngularModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  activeTab: 'overview'|'upcoming'|'recent'|'alerts' = 'overview';

  upcomingSessions: Session[] = [
    { id: 1, number: '001', type: 'Ordinary',      date: '2025-05-15', time: '10:00 AM', quorum: 'Pending' },
    { id: 2, number: '002', type: 'Extraordinary', date: '2025-05-22', time: '2:00 PM',  quorum: 'Pending' },
  ];

  recentSessions: Session[] = [
    { id: 3, number: 'S-2025-003', type: 'Ordinary',      date: '2025-04-30', time: '10:00 AM', quorum: 'Achieved', status: 'Completed' },
    { id: 4, number: 'S-2025-002', type: 'Ordinary',      date: '2025-04-15', time: '10:00 AM', quorum: 'Achieved', status: 'Completed' },
    { id: 5, number: 'S-2025-001', type: 'Extraordinary', date: '2025-04-01', time: '2:00 PM',  quorum: 'Not Achieved', status: 'Cancelled' },
  ];

  alerts: Alert[] = [
    { id: 1, type: 'warning', message: 'Session #002 is missing agenda items',             date: '2025-05-10' },
    { id: 2, type: 'info',    message: 'New member added: Sarah Johnson',                    date: '2025-05-09' },
    { id: 3, type: 'success', message: 'Minutes for Session #S-2025-003 generated',         date: '2025-05-01' },
  ];

  // helper to style the tab button
  isActive(tab: string) { return this.activeTab === tab; }
}
