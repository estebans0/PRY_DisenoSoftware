// src/app/pages/sessions/[id]/session-detail/session-detail.component.ts
import { Component, OnInit }            from '@angular/core';
import { CommonModule }                 from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule }          from 'lucide-angular';
import { SessionService, Session }      from '../../../../services/session.service';
import { environment }                  from '../../../../../environments/environment';

@Component({
  selector: 'app-session-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LucideAngularModule,
  ],
  templateUrl: './session-detail.component.html',
  styleUrls: ['./session-detail.component.scss']
})
export class SessionDetailComponent implements OnInit {
  activeTab: 'overview' | 'agenda' | 'attendees' | 'documents' = 'overview';
  sessionId!: string;
  session!: Session;

  attendees: { name: string; position: string; status: string }[] = [];
  agenda:    { title: string; presenter: string; duration: number; documents: { fileName: string; filePath: string }[] }[] = [];
  documents: { name: string; filePath: string; size: string; uploadedBy: string; uploadedAt: string }[] = [];

  confirmedCount = 0;
  pendingCount   = 0;
  declinedCount  = 0;
  totalDuration  = 0;

  constructor(
    private route:          ActivatedRoute,
    private router:         Router,
    private sessionService: SessionService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id || id === 'new') {
      this.router.navigate(['/sessions/new']);
      return;
    }
    this.sessionId = id;
    this.loadSessionData();
  }

  private loadSessionData(): void {
    this.sessionService.getSession(this.sessionId).subscribe(
      sess => {
        this.session = sess;

        // -- Attendees --
        this.attendees = (sess.attendees || []).map(a => ({
          name:     a.name,
          position: a.role,
          status:   this.capitalize(a.status)
        }));

        // -- Agenda (per‐item docs only) --
        this.agenda = (sess.agenda || []).map((item: any) => ({
          title:     item.title,
          presenter: item.presenter,
          duration:  item.duration,
          documents: (item.documents || []).map((d: any) => ({
            fileName: d.fileName,
            filePath: d.filePath
          }))
        }));

        // -- Top‐level documents --
        this.documents = (sess.documents || []).map((d: any) => ({
          name:       d.fileName,
          filePath:   d.filePath,
          size:       this.humanFileSize(d.fileSize),
          uploadedBy: sess.createdBy?.name || 'Unknown',
          // format uploadDate to yyyy-MM-dd
          uploadedAt: new Date(d.uploadDate).toISOString().split('T')[0]
        }));

        // -- Totals --
        this.confirmedCount = this.attendees.filter(a => a.status === 'Confirmed').length;
        this.pendingCount   = this.attendees.filter(a => a.status === 'Pending').length;
        this.declinedCount  = this.attendees.filter(a => a.status === 'Declined').length;
        this.totalDuration  = this.agenda.reduce((sum, itm) => sum + itm.duration, 0);
      },
      err => console.error('Could not load session', err)
    );
  }

  private humanFileSize(bytes: number): string {
    const thresh = 1024;
    if (Math.abs(bytes) < thresh) return bytes + ' B';
    const units = ['KB','MB','GB','TB'];
    let u = -1;
    do {
      bytes /= thresh;
      ++u;
    } while (Math.abs(bytes) >= thresh && u < units.length - 1);
    return bytes.toFixed(1) + ' ' + units[u];
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  goToEdit(): void {
    this.router.navigate(['/sessions', this.sessionId, 'edit']);
  }

  goToStart(): void {
    this.sessionService.startSession(this.sessionId).subscribe(
      () => this.router.navigate(['/sessions']),
      err => console.error('Unable to start session', err)
    );
  }

  viewMinutes(): void {
    this.router.navigate(['/sessions', this.sessionId, 'minutes']);
  }

  isActive(tab: 'overview'|'agenda'|'attendees'|'documents'): boolean {
    return this.activeTab === tab;
  }

  badgeClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'pending':   return 'bg-amber-100 text-amber-800   dark:bg-amber-900   dark:text-amber-100';
      case 'declined':  return 'bg-red-100   text-red-800     dark:bg-red-900     dark:text-red-100';
      default:          return 'bg-gray-100  text-gray-800    dark:bg-gray-800    dark:text-gray-100';
    }
  }

  /**
   * Returns a URL to download a file that lives on the uploads folder.
   */
  getDownloadUrl(path: string): string {
    return `${environment.apiUrl.replace(/\/$/, '')}/uploads/${path}`;
  }
}
