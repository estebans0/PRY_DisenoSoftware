// frontend/src/app/pages/inbox/inbox.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { RouterModule }      from '@angular/router';
import { FormsModule }       from '@angular/forms';
import { MessageService, Mensaje } from '../../services/message.service';
import { AuthService }       from '../../services/auth.service';
import { LucideAngularModule } from 'lucide-angular';

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

  toggleExpand(m: Mensaje) {
    if (this.expandedIds.has(m._id)) {
      this.expandedIds.delete(m._id);
    } else {
      this.expandedIds.add(m._id);
      // mark read on first expand
      if (!m.read) {
        this.msgSvc.markRead(m._id).subscribe(updated => m.read = updated.read);
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
}
