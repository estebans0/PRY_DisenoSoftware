// frontend/src/app/pages/sessions/[id]/session-notify/session-notify.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { FormsModule }       from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule }               from 'lucide-angular';

import { SessionService, Session } from '../../../../services/session.service';

@Component({
  selector: 'app-session-notify',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,      // <-- ngModel
    RouterModule,
    LucideAngularModule
  ],
  templateUrl: './session-notify.component.html',
  styleUrls: ['./session-notify.component.scss']
})
export class SessionNotifyComponent implements OnInit {
  sessionId!: string;
  session!: Session;

  attendees: Array<{ name: string; email: string; status: string }> = [];
  guests:    Array<{ name: string; email: string }> = [];
  documents: Array<{ name: string; size: string }> = [];

  // selections by email
  selectedRecipients: string[] = [];
  selectedGuests:     string[] = [];

  includeAgenda      = true;
  includeDocuments   = true;
  includeAbsenceForm = true;

  activeTab: 'members'|'guests' = 'members';

  // now fully mutable fields
  emailSubject    = '';
  memberEmailBody = '';
  guestEmailBody  = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sessionService: SessionService
  ) {}

  ngOnInit() {
    this.sessionId = this.route.snapshot.paramMap.get('id')!;
    this.sessionService.getSession(this.sessionId).subscribe({
      next: sess => {
        this.session = sess;

        // map attendees & guests
        this.attendees = (sess.attendees || []).map(a => ({
          name:   a.name,
          email:  a.email,
          status: a.status
        }));
        this.guests = (sess.guests || []).map(g => ({
          name:  g.name || 'Guest',
          email: g.email
        }));
        this.documents = (sess.documents || []).map(d => ({
          name: d.fileName,
          size: `${(d.fileSize/1024/1024).toFixed(1)} MB`
        }));

        // default to pending + all guests
        this.selectedRecipients = this.attendees
          .filter(a => a.status === 'Pending')
          .map(a => a.email);
        this.selectedGuests = this.guests.map(g => g.email);

        // ─ Build preview exactly like MeetingNoticeBuilder ───────

        // format date + time (prefer startTime if set)
        const dateObj = new Date(sess.date);
        const dateStr = dateObj.toLocaleDateString();
        const timeStr = sess.startTime
          ? new Date(sess.startTime).toLocaleTimeString()
          : sess.time;

        // subject
        this.emailSubject = `Meeting Notice: Session #${sess.number}`;

        // body
        this.memberEmailBody =
          `Dear member,\n\n` +
          `You are invited to session #${sess.number} on ${dateStr} at ${timeStr}.\n\n` +
          `Please confirm your attendance.\n\n— BoardFlow`;

        // guests use the same builder
        this.guestEmailBody = this.memberEmailBody;
      },
      error: err => console.error('Failed to load session', err)
    });
  }

  // ─── selection helpers ────────────────────────────────────────────────────

  toggleRecipient(email: string) {
    const i = this.selectedRecipients.indexOf(email);
    if (i > -1) this.selectedRecipients.splice(i, 1);
    else         this.selectedRecipients.push(email);
    this.selectedRecipients = [...this.selectedRecipients];
  }

  toggleGuest(email: string) {
    const i = this.selectedGuests.indexOf(email);
    if (i > -1) this.selectedGuests.splice(i, 1);
    else         this.selectedGuests.push(email);
    this.selectedGuests = [...this.selectedGuests];
  }

  selectAll() {
    this.selectedRecipients = this.attendees.map(a => a.email);
    this.selectedGuests     = this.guests.map(g => g.email);
  }

  selectNone() {
    this.selectedRecipients = [];
    this.selectedGuests     = [];
  }

  selectPending() {
    this.selectedRecipients = this.attendees
      .filter(a => a.status === 'Pending')
      .map(a => a.email);
    this.selectedGuests = [];
  }

  // ─── fire notify API ─────────────────────────────────────────────────────

  handleSendNotification() {
    this.sessionService.notifySession(this.sessionId).subscribe({
      next: resp => {
        alert(
          `Notified ${resp.notified} people:\n` +
          resp.recipients.join(', ')
        );
        this.router.navigate(['/sessions', this.sessionId]);
      },
      error: err => {
        console.error('Notify failed', err);
        alert('Failed to send notices.');
      }
    });
  }
}
