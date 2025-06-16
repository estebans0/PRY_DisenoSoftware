// src/app/pages/sessions/session-list/session-list.component.ts
import { Component, OnInit }    from '@angular/core';
import { CommonModule }         from '@angular/common';
import { RouterModule }         from '@angular/router';
import { SessionService } from '../../../services/session.service';

interface Session {
  _id: string;
  number: string;
  date: string;
  location: string;
  status: string;
  type: string; // Add this line
  time?: string;
}

@Component({
  selector: 'app-session-list',
  standalone: true,
  imports: [
    CommonModule,    // for *ngIf, *ngFor
    RouterModule     // for [routerLink]
  ],
  templateUrl: './session-list.component.html',
  styleUrls: ['./session-list.component.scss']
})
export class SessionListComponent implements OnInit {
  sessions: Session[] = [];
  loading = true;
  error: string | null = null;

  constructor(private sessionsSvc: SessionService) {}

  ngOnInit() {
    this.sessionsSvc.getSessions().subscribe({
      next: (data: Session[]) => {
        this.sessions = data;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = 'Failed to load sessions';
        this.loading = false;
        console.error(err);
      }
    });
  }
}
