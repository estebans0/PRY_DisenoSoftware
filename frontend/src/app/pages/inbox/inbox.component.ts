// frontend/src/app/pages/inbox/inbox.component.ts
import { Component, OnInit }        from '@angular/core';
import { CommonModule }             from '@angular/common';
import { RouterModule }             from '@angular/router';
import { FormsModule }              from '@angular/forms';
import { LucideAngularModule }      from 'lucide-angular';

import { MessageService, Mensaje }  from '../../services/message.service';
import { AuthService }              from '../../services/auth.service';

@Component({
  selector: 'app-inbox',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    LucideAngularModule
  ],
  templateUrl: './inbox.component.html',
  styleUrls: ['./inbox.component.scss']
})
export class InboxComponent implements OnInit {
  inbox: Mensaje[] = [];
  loading = false;
  error: string | null = null;

  /** track which messages are expanded */
  expandedIds = new Set<string>();

  /** sort order: 'desc' = newest first, 'asc' = oldest first */
  sortOrder: 'asc' | 'desc' = 'desc';

  constructor(
    private msgSvc: MessageService,
    private auth:   AuthService
  ) {}

  ngOnInit() {
    const user = this.auth.getCurrentUser();
    if (!user?.email) {
      this.error = 'You must be logged in to see your inbox.';
      return;
    }
    this.refresh();
  }

  /** load messages into inbox[] */
  refresh() {
    this.loading = true;
    this.error   = null;
    this.inbox   = [];
    const email = this.auth.getCurrentUser()!.email;

    this.msgSvc.list(email).subscribe({
      next: msgs => {
        this.inbox = msgs;
        this.loading = false;
      },
      error: err => {
        console.error(err);
        this.error   = 'Failed to load messages.';
        this.loading = false;
      }
    });
  }

  /** toggles expanded view and marks read on first open */
  toggleExpand(m: Mensaje) {
    if (this.expandedIds.has(m._id)) {
      this.expandedIds.delete(m._id);
    } else {
      this.expandedIds.add(m._id);
      if (!m.read) {
        this.msgSvc.markRead(m._id)
          .subscribe(updated => m.read = updated.read);
      }
    }
  }

  deleteMessage(m: Mensaje, event: MouseEvent) {
    event.stopPropagation();
    if (!confirm('Delete this message?')) return;
    this.msgSvc.delete(m._id).subscribe({
      next: () => this.refresh(),
      error: err => console.error(err)
    });
  }

  clearAll() {
    if (!confirm('Clear your entire inbox?')) return;
    const email = this.auth.getCurrentUser()!.email;
    this.msgSvc.clearInbox(email).subscribe({
      next: () => this.refresh(),
      error: err => console.error(err)
    });
  }

  /**
   * Return the messages in time‐sorted order
   */
  get sortedInbox(): Mensaje[] {
    return this.inbox
      .slice()  // copy so we don't mutate the original
      .sort((a, b) => {
        const ta = new Date(a.timestamp).valueOf();
        const tb = new Date(b.timestamp).valueOf();
        return this.sortOrder === 'asc' ? ta - tb : tb - ta;
      });
  }
}
