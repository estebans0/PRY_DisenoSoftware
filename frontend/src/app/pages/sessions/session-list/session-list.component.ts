// src/app/pages/sessions/session-list/session-list.component.ts
import { Component, OnInit }    from '@angular/core';
import { CommonModule }         from '@angular/common';
import { RouterModule }         from '@angular/router';
import { SessionService, Session } from '../../../services/session.service';

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

  constructor(private sessionsSvc: SessionService) {}

  ngOnInit() {
    this.sessionsSvc.list().subscribe({
      next: data => {
        this.sessions = data;
        this.loading = false;
      },
      error: err => {
        console.error(err);
        this.loading = false;
      }
    });
  }
}
