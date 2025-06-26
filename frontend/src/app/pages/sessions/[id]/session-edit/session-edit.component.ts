// src/app/pages/sessions/[id]/session-edit/session-edit.component.ts
import { Component, OnInit }                   from '@angular/core';
import { CommonModule }                         from '@angular/common';
import { FormsModule }                          from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule }                  from 'lucide-angular';
import { forkJoin, of }                         from 'rxjs';
import { switchMap, catchError, mapTo }         from 'rxjs/operators';

import { SessionService } from '../../../../services/session.service';
import { MemberService }  from '../../../../services/member.service';

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
  documents: any[];  // existing docs metadata
  files:     File[]; // newly added PDFs
}

@Component({
  selector: 'app-session-edit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    LucideAngularModule,
  ],
  templateUrl: './session-edit.component.html',
  styleUrls: ['./session-edit.component.scss']
})
export class SessionEditComponent implements OnInit {
  // ─── Tabs ───
  activeTab: 'details'|'attendees'|'agenda'|'documents' = 'details';

  // ─── Loading & Routing ───
  isLoading = true;
  sessionId!: string;

  // ─── Form state ───
  date = '';
  sessionData = {
    number:     '',
    type:       'Ordinary' as 'Ordinary'|'Extraordinary',
    time:       '10:00',
    modality:   'In Person' as 'In Person'|'Virtual'|'Hybrid',
    location:   '',
    description:''
  };

  // ─── Members & Attendees ───
  members: MemberOption[]     = [];
  selectedMemberIds: string[] = [];
  get attendeeOptions() {
    return this.members.filter(m => this.selectedMemberIds.includes(m.id));
  }

  // ─── Guests ───
  guests: { id: number; name?: string; email: string }[] = [];
  newGuestName  = '';
  newGuestEmail = '';
  showGuestModal = false;
  private nextGuestId = 1;

  // ─── Agenda items ───
  agendaItems: AgendaItemForm[] = [];
  durations = [5,10,15,20,30,45,60];

  // ─── Session‐level documents ───
  sessionFiles: any[] = [];        // existing metadata
  newSessionFiles: File[] = [];    // newly selected PDFs

  // ─── Busy state ───
  uploading = false;

  constructor(
    private route:      ActivatedRoute,
    private router:     Router,
    private sessionSvc: SessionService,
    private memberSvc:  MemberService,
  ) {}

  ngOnInit(): void {
    this.sessionId = this.route.snapshot.paramMap.get('id')!;
    if (!this.sessionId || this.sessionId === 'new') {
      this.router.navigate(['/sessions','new']);
      return;
    }

    // first load members, then session
    this.memberSvc.list().pipe(
      switchMap(members => {
        this.members = members.map(m => ({
          id:       m._id!,
          name:     `${m.firstName} ${m.lastName}`,
          position: m.position,
          email:    m.email
        }));
        return this.sessionSvc.getSession(this.sessionId);
      }),
      catchError(err => {
        console.error(err);
        this.router.navigate(['/sessions']);
        return of(null);
      })
    ).subscribe(sess => {
      if (!sess) return;
      // --- Details ---
      this.sessionData = {
        number:     sess.number,
        type:       sess.type,
        time:       sess.time,
        modality:   (sess as any).modality || 'In Person',
        location:   sess.location,
        description:sess.description || ''
      };
      this.date = sess.date.slice(0,10);

      // --- Attendees ---
      this.selectedMemberIds = (sess.attendees || [])
        .map(a => this.members.find(m => m.email === a.email)?.id)
        .filter(Boolean) as string[];

      // --- Guests ---
      this.guests = sess.guests || [];
      this.nextGuestId = this.guests.length + 1;

      // --- Agenda ---
      this.agendaItems = (sess.agenda || []).map(ai => ({
        id:        ai.order,
        title:     ai.title,
        presenter: ai.presenter,
        duration:  ai.duration,
        documents: ai.documents || [],
        files:     []
      }));

      // --- Documents ---
      this.sessionFiles = (sess as any).documents || [];
      this.isLoading = false;
    });
  }

  // ─── Tab helpers & Guests ───
  isTab(tab: string) { return this.activeTab === tab; }
  selectAll()   { this.selectedMemberIds = this.members.map(m=>m.id); }
  deselectAll() { this.selectedMemberIds = []; }
  toggleMember(id: string) {
    this.selectedMemberIds = this.selectedMemberIds.includes(id)
      ? this.selectedMemberIds.filter(x=>x!==id)
      : [...this.selectedMemberIds,id];
  }
  openGuestModal()  { this.showGuestModal=true; }
  closeGuestModal() { this.showGuestModal=false; this.newGuestName=''; this.newGuestEmail=''; }
  addGuest() {
    if (!this.newGuestEmail.trim()) return;
    this.guests.push({ id: this.nextGuestId++, name: this.newGuestName.trim(), email: this.newGuestEmail.trim() });
    this.closeGuestModal();
  }
  removeGuest(id:number) { this.guests = this.guests.filter(g => g.id !== id); }

  // ─── Agenda handlers ───
  addAgendaItem() {
    const next = this.agendaItems.length
      ? Math.max(...this.agendaItems.map(i=>i.id)) + 1
      : 1;
    this.agendaItems.push({ id: next, title: '', presenter: '', duration: 15, documents: [], files: [] });
  }
  removeAgendaItem(id:number) {
    this.agendaItems = this.agendaItems.filter(i=>i.id!==id);
  }
  removeAgendaItemDoc(itemId:number, idx:number) {
    const item = this.agendaItems.find(i=>i.id===itemId);
    if (!item) return;
    if (item.documents?.length) item.documents.splice(idx,1);
    if (item.files?.length)     item.files.splice(idx,1);
  }

  // <—— **NEW**: same as in your session-new component —>
  updateAgendaItem(id: number, field: keyof AgendaItemForm, value: any) {
    this.agendaItems = this.agendaItems.map(i =>
      i.id === id ? { ...i, [field]: value } : i
    );
  }

  private addFilesToAgendaItem(itemId:number, files:File[]){
    const idx = this.agendaItems.findIndex(i=>i.id===itemId);
    if (idx === -1) return;
    this.agendaItems[idx].files = [...(this.agendaItems[idx].files||[]), ...files];
  }
  onAgendaFilesSelected(evt:Event, itemId:number) {
    const inp = evt.target as HTMLInputElement;
    if (!inp.files) return;
    this.addFilesToAgendaItem(itemId, Array.from(inp.files).filter(f=>f.type==='application/pdf'));
  }
  onAgendaDragOver(evt:DragEvent){ evt.preventDefault(); }
  onAgendaFilesDropped(evt:DragEvent, itemId:number){
    evt.preventDefault();
    if (!evt.dataTransfer?.files) return;
    this.addFilesToAgendaItem(itemId, Array.from(evt.dataTransfer.files).filter(f=>f.type==='application/pdf'));
  }

  // <—— **NEW**: remove only the newly-added file from an agenda item —>
  removeFile(itemId: number, fileIndex: number) {
    const item = this.agendaItems.find(i => i.id === itemId);
    if (!item || !item.files) return;
    item.files.splice(fileIndex, 1);
  }

  // ─── Top-level documents ───
  onDocsDragOver(evt:DragEvent){ evt.preventDefault(); }
  onDocsDropped(evt:DragEvent){
    evt.preventDefault();
    if (!evt.dataTransfer?.files) return;
    Array.from(evt.dataTransfer.files)
      .filter(f=>f.type==='application/pdf')
      .forEach(f=>this.newSessionFiles.push(f));
  }
  onDocsSelected(evt:Event){
    const inp = evt.target as HTMLInputElement;
    if (!inp.files) return;
    Array.from(inp.files)
      .filter(f=>f.type==='application/pdf')
      .forEach(f=>this.newSessionFiles.push(f));
  }
  removeDocument(idx:number) {
    if (idx < this.sessionFiles.length) {
      this.sessionFiles.splice(idx,1);
    } else {
      this.newSessionFiles.splice(idx - this.sessionFiles.length, 1);
    }
  }

  // ─── Save ───
  private buildAttendeesPayload() {
    return this.selectedMemberIds.map(id => {
      const m = this.members.find(x=>x.id===id)!;
      return { name: m.name, email: m.email, status:'Confirmed', role:m.position };
    });
  }

  handleSubmit(){
    if (!this.date || !this.selectedMemberIds.length) return console.error('Missing fields');
    this.uploading = true;

    const agendaPayload = this.agendaItems.map(i => {
      // keep all of the existing documents...
      const existingDocs = i.documents || [];

      // ...and append any newly-selected files as metadata
      const newDocsMeta = (i.files || []).map(f => ({
        fileName:   f.name,
        fileType:   f.type,
        fileSize:   f.size,
        filePath:   f.name,       // backend will rename on upload
        uploadDate: new Date()
      }));

      return {
        order:         i.id,
        title:         i.title || 'Untitled',
        presenter:     i.presenter || 'Unknown',
        duration:      i.duration,
        estimatedTime: i.duration,
        documents:     [...existingDocs, ...newDocsMeta]
      };
    });
    const docsPayload = [
      ...this.sessionFiles,
      ...this.newSessionFiles.map(f=>({
        fileName:f.name,fileType:f.type,fileSize:f.size,
        filePath:f.name,uploadDate:new Date()
      }))
    ];
    const payload: any = {
      ...this.sessionData,
      date:      this.date,
      attendees: this.buildAttendeesPayload(),
      guests:    this.guests,
      agenda:    agendaPayload,
      documents: docsPayload
    };

    this.sessionSvc.updateSession(this.sessionId, payload).pipe(
      switchMap(updated => {
        const uploads = this.agendaItems
          .filter(i=>i.files?.length)
          .map(i =>
            this.sessionSvc.uploadAgendaDocuments(this.sessionId,i.id,i.files!)
              .pipe(catchError(()=>of(null)))
          );
        return uploads.length
          ? forkJoin(uploads).pipe(mapTo(updated))
          : of(updated);
      }),
      catchError(err => {
        console.error(err);
        this.uploading = false;
        return of(null);
      })
    ).subscribe(res => {
      this.uploading = false;
      if (res) {
        this.router.navigate(['/sessions']);
      }
    });
  }

  handleSaveAndSend(){
    this.handleSubmit();
    // add notice-sending here
  }
}
