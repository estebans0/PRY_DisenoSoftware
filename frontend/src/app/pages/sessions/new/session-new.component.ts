// src/app/pages/sessions/new/session-new.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { FormsModule }       from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { LucideAngularModule }  from 'lucide-angular';
import { SessionService }       from '../../../services/session.service';
import { MemberService }        from '../../../services/member.service';
import { AuthService }          from '../../../services/auth.service';
import { forkJoin, of } from 'rxjs';
import { switchMap, mapTo, catchError } from 'rxjs/operators';

interface MemberOption {
  id:       string;
  name:     string;
  position: string;
  email:    string;
}

interface AgendaItemForm {
  id:        number;
  title:     string;
  presenter: string;
  duration:  number;
  documents: string[];     // unused here
  files:     File[];       // locally selected PDFs
}

@Component({
  selector: 'app-session-new',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    LucideAngularModule,
  ],
  templateUrl: './session-new.component.html',
  styleUrls: ['./session-new.component.scss']
})
export class SessionNewComponent implements OnInit {
  // --- Tabs ---
  activeTab: 'details'|'attendees'|'agenda'|'documents' = 'details';

  // --- Members & Attendees ---
  members: MemberOption[]     = [];
  selectedMemberIds: string[] = [];

  // --- Form state ---
  date?: string;
  sessionData = {
    number:      '',
    type:        'ordinary',
    time:        '10:00',
    modality:    'in-person',   // <-- now will be saved
    location:    '',
    description: '',
  };

  // --- Guests ---
  guests: { id: number; name?: string; email: string }[] = [];
  newGuestName  = '';
  newGuestEmail = '';
  showGuestModal = false;
  private nextGuestId = 1;

  // --- Agenda items ---
  agendaItems: AgendaItemForm[] = [
    { id: 1, title: '', presenter: '', duration: 15, documents: [], files: [] }
  ];
  durations = [5,10,15,20,30,45,60];

  // --- Session‐level documents ---
  sessionFiles: File[] = [];

  // disable while uploading
  uploading = false;

  constructor(
    private router:     Router,
    private sessionSvc: SessionService,
    private memberSvc:  MemberService,
    private auth:       AuthService,
  ) {}

  ngOnInit() {
    this.memberSvc.list().subscribe({
      next: data => {
        this.members = data.map(m => ({
          id:       m._id,
          name:     `${m.firstName} ${m.lastName}`,
          position: m.position,
          email:    m.email
        }));
        this.selectedMemberIds = [];
      },
      error: err => console.error('Error fetching members', err)
    });
  }

  // --- Tab helpers ---
  isTab(tab: string) { return this.activeTab === tab; }

  // --- Attendee selection ---
  selectAll()   { this.selectedMemberIds = this.members.map(m => m.id); }
  deselectAll() { this.selectedMemberIds = []; }
  toggleMember(id: string) {
    this.selectedMemberIds = this.selectedMemberIds.includes(id)
      ? this.selectedMemberIds.filter(x => x !== id)
      : [...this.selectedMemberIds, id];
  }

  // --- Guest modal ---
  openGuestModal()  { this.showGuestModal = true; }
  closeGuestModal() {
    this.showGuestModal = false;
    this.newGuestName = '';
    this.newGuestEmail = '';
  }
  addGuest() {
    if (!this.newGuestEmail.trim()) return;
    this.guests.push({
      id:    this.nextGuestId++,
      name:  this.newGuestName.trim(),
      email: this.newGuestEmail.trim()
    });
    this.closeGuestModal();
  }
  removeGuest(id: number) {
    this.guests = this.guests.filter(g => g.id !== id);
  }

  // --- Agenda helpers ---
  /** 
   * Only those members that were checked in the Attendees tab 
   */
  get attendeeOptions(): MemberOption[] {
    return this.members.filter(m => this.selectedMemberIds.includes(m.id));
  }
  
  addAgendaItem() {
    const nextId = this.agendaItems.length
      ? Math.max(...this.agendaItems.map(i => i.id)) + 1
      : 1;
    this.agendaItems.push({
      id:        nextId,
      title:     '',
      presenter: '',
      duration:  15,
      documents: [],
      files:     []
    });
  }
  removeAgendaItem(id: number) {
    if (this.agendaItems.length > 1) {
      this.agendaItems = this.agendaItems.filter(i => i.id !== id);
    }
  }
  updateAgendaItem(id: number, field: keyof AgendaItemForm, value: any) {
    this.agendaItems = this.agendaItems.map(i =>
      i.id === id ? { ...i, [field]: value } : i
    );
  }

  private addFilesToAgendaItem(itemId: number, newFiles: File[]) {
    const idx = this.agendaItems.findIndex(i => i.id === itemId);
    if (idx === -1) return;
    const existing = this.agendaItems[idx].files || [];
    this.agendaItems[idx].files = [...existing, ...newFiles];
  }
  onAgendaFilesSelected(evt: Event, itemId: number) {
    const input = evt.target as HTMLInputElement;
    if (!input.files) return;
    const files = Array.from(input.files)
      .filter(f => f.type === 'application/pdf');
    this.addFilesToAgendaItem(itemId, files);
  }
  onAgendaDragOver(evt: DragEvent) {
    evt.preventDefault();
  }
  onAgendaFilesDropped(evt: DragEvent, itemId: number) {
    evt.preventDefault();
    if (!evt.dataTransfer?.files) return;
    const files = Array.from(evt.dataTransfer.files)
      .filter(f => f.type === 'application/pdf');
    this.addFilesToAgendaItem(itemId, files);
  }
  removeFile(itemId: number, fileIndex: number) {
    const idx = this.agendaItems.findIndex(i => i.id === itemId);
    if (idx === -1) return;
    this.agendaItems[idx].files!.splice(fileIndex, 1);
  }

  // --- Session‐level documents tab helpers ---
  onDocsDragOver(evt: DragEvent) {
    evt.preventDefault();
  }
  onDocsDropped(evt: DragEvent) {
    evt.preventDefault();
    if (!evt.dataTransfer?.files) return;
    Array.from(evt.dataTransfer.files)
      .filter(f => f.type === 'application/pdf')
      .forEach(f => this.sessionFiles.push(f));
  }
  onDocsSelected(evt: Event) {
    const input = evt.target as HTMLInputElement;
    if (!input.files) return;
    Array.from(input.files)
      .filter(f => f.type === 'application/pdf')
      .forEach(f => this.sessionFiles.push(f));
  }
  removeDocument(index: number) {
    this.sessionFiles.splice(index, 1);
  }

  // --- Final submission ---

  private buildAttendeesPayload() {
    return this.selectedMemberIds.map(id => {
      const m = this.members.find(x => x.id === id)!;
      return {
        name:   m.name,
        email:  m.email,
        status: 'Confirmed',
        role:   m.position
      };
    });
  }

  handleSubmit() {
    if (!this.date || !this.selectedMemberIds.length) {
      console.error('Date and at least one attendee are required');
      return;
    }

    this.uploading = true;

    // 1) map each agenda item, *including* its PDF‐metadata
    const agendaPayload = this.agendaItems.map(i => ({
      order:         i.id,
      title:         i.title     || 'Untitled',
      presenter:     i.presenter || 'Unknown',
      duration:      i.duration,
      estimatedTime: i.duration,
      documents:     (i.files || []).map(f => ({
        fileName:   f.name,
        fileType:   f.type,
        fileSize:   f.size,
        filePath:   f.name,           // back‐end will rename on upload
        uploadDate: new Date()
      }))
    }));

    // 2) top‐level session documents payload
    const sessionDocs = this.sessionFiles.map(f => ({
      fileName:   f.name,
      fileType:   f.type,
      fileSize:   f.size,
      filePath:   f.name,
      uploadDate: new Date()
    }));

    // 3) build the full payload
    const payload: any = {
      ...this.sessionData,    // includes modality now
      date:      this.date,
      attendees: this.buildAttendeesPayload(),
      guests:    this.guests,
      // stick agenda + docs in right shape:
      agenda:    agendaPayload,
      documents: sessionDocs
    };

    // 4) attach createdBy
    const me = this.auth.getCurrentUser();
    if (me && me._id && me.firstName && me.lastName) {
      payload.createdBy = {
        _id:  me._id,
        name: `${me.firstName} ${me.lastName}`
      };
    }

    // 5) POST → then optionally upload raw PDFs
    this.sessionSvc.createSession(payload).pipe(
      switchMap(created => {
        const sessionId = created._id!;
        // agenda PDFs
        const uploads = this.agendaItems
          .filter(i => i.files && i.files.length)
          .map(i =>
            this.sessionSvc
              .uploadAgendaDocuments(sessionId, i.id, i.files!)
              .pipe(catchError(() => of(null)))
          );
        return uploads.length
          ? forkJoin(uploads).pipe(mapTo(created))
          : of(created);
      }),
      catchError(err => {
        console.error(err);
        this.uploading = false;
        return of(null);
      })
    ).subscribe(result => {
      this.uploading = false;
      if (result) {
        this.router.navigate(['/sessions']);
      }
    });
  }

  handleSaveAndSend() {
    this.handleSubmit();
  }
}
