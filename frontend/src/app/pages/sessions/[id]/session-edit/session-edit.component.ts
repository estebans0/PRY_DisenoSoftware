// src/app/pages/sessions/[id]/session-edit/session-edit.component.ts
import { Component, OnInit }                  from '@angular/core';
import { CommonModule }                        from '@angular/common';
import { FormsModule }                         from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule }                 from 'lucide-angular';

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
  activeTab: 'details'|'attendees'|'agenda'|'documents' = 'details';
  isLoading = true;
  sessionId!: string;

  // bound form controls
  date = '2025-05-15';
  sessionData = {
    number:     '',
    type:       'ordinary',
    time:       '10:00',
    modality:   'in-person',
    location:   '',
    description:''
  };

  // members & selected attendees
  members = [
    { id:1, name:'John Doe',       position:'Chairperson',      email:'john.doe@example.com' },
    { id:2, name:'Jane Smith',     position:'Vice Chairperson', email:'jane.smith@example.com' },
    { id:3, name:'Robert Johnson', position:'Secretary',        email:'robert.johnson@example.com' },
    { id:4, name:'Emily Davis',    position:'Treasurer',        email:'emily.davis@example.com' },
    { id:5, name:'Michael Wilson', position:'Board Member',     email:'michael.wilson@example.com' },
    { id:6, name:'Sarah Thompson', position:'Board Member',     email:'sarah.thompson@example.com' },
    { id:7, name:'David Martinez', position:'Board Member',     email:'david.martinez@example.com' },
    { id:8, name:'Jennifer Garcia',position:'Board Member',     email:'jennifer.garcia@example.com' },
  ];
  selectedMembers: number[] = [];

  // ** Guests **
  guests: Array<{ id: number; name?: string; email: string }> = [];
  newGuestName = '';
  newGuestEmail = '';
  showGuestModal = false;
  private nextGuestId = 1;

  // agenda items
  agendaItems: Array<{
    id:number;
    title:string;
    presenter:string;
    duration:number;
    documents:string[];
  }> = [];

  // uploaded docs list
  uploadedDocs = [
    { name:'previous_minutes.pdf',       size:'1.2 MB', by:'Robert Johnson', uploadedAt:'2025-05-01' },
    { name:'financial_report_q1_2025.pdf',size:'3.5 MB', by:'Emily Davis',    uploadedAt:'2025-05-05' },
    { name:'budget_comparison.xlsx',     size:'0.8 MB', by:'Emily Davis',    uploadedAt:'2025-05-05' },
    { name:'strategic_plan_update.pptx', size:'5.2 MB', by:'Jane Smith',     uploadedAt:'2025-05-08' },
    { name:'project_proposals.pdf',      size:'2.7 MB', by:'David Martinez', uploadedAt:'2025-05-10' },
  ];

  // durations dropdown
  durations = [5,10,15,20,30,45,60];

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // grab the :id
    this.sessionId = this.route.snapshot.paramMap.get('id')!;

    // if creating new, redirect
    if (this.sessionId === 'new') {
      this.router.navigate(['/sessions','new']);
      return;
    }

    // simulate API fetch
    setTimeout(() => {
      // mock existing session #1
      this.sessionData = {
        number:     '001',
        type:       'ordinary',
        time:       '10:00',
        modality:   'in-person',
        location:   'Board Room A, Main Building',
        description:'Regular monthly board meeting to discuss ongoing projects and financial updates.'
      };
      this.date = '2025-05-15';
      this.selectedMembers = this.members.map(m => m.id);
      this.agendaItems = [
        { id:1, title:'Approval of Previous Minutes', presenter:'John Doe', duration:10, documents:['previous_minutes.pdf'] },
        { id:2, title:'Financial Report Q1 2025',     presenter:'Emily Davis', duration:20, documents:['financial_report_q1_2025.pdf','budget_comparison.xlsx'] },
        { id:3, title:'Strategic Plan Update',        presenter:'Jane Smith', duration:30, documents:['strategic_plan_update.pptx'] },
        { id:4, title:'New Project Proposals',        presenter:'David Martinez', duration:20, documents:['project_proposals.pdf'] },
        { id:5, title:'Any Other Business',           presenter:'John Doe', duration:10, documents:[] },
      ];
      this.isLoading = false;
    }, 300);
  }

  // Tab nav helper
  isTab(tab: 'details'|'attendees'|'agenda'|'documents'): boolean {
    return this.activeTab === tab;
  }

  // Attendees
  selectAll(): void {
    this.selectedMembers = this.members.map(m => m.id);
  }
  deselectAll(): void {
    this.selectedMembers = [];
  }
  toggleMember(id: number): void {
    const idx = this.selectedMembers.indexOf(id);
    if (idx > -1) {
      this.selectedMembers.splice(idx, 1);
    } else {
      this.selectedMembers.push(id);
    }
    // reassign to trigger change detection
    this.selectedMembers = [...this.selectedMembers];
  }

  // ** Guest helpers **
  openGuestModal(): void {
    this.showGuestModal = true;
  }
  closeGuestModal(): void {
    this.showGuestModal = false;
    this.newGuestName = '';
    this.newGuestEmail = '';
  }
  addGuest(): void {
    if (!this.newGuestEmail.trim()) return;
    this.guests.push({
      id: this.nextGuestId++,
      name: this.newGuestName.trim(),
      email: this.newGuestEmail.trim()
    });
    this.closeGuestModal();
  }
  removeGuest(id: number): void {
    this.guests = this.guests.filter(g => g.id !== id);
  }

  // Agenda items
  addAgendaItem(): void {
    const newId = this.agendaItems.length
      ? Math.max(...this.agendaItems.map(i => i.id)) + 1
      : 1;
    this.agendaItems.push({ id:newId, title:'', presenter:'', duration:15, documents:[] });
  }
  removeAgendaItem(id: number): void {
    this.agendaItems = this.agendaItems.filter(i => i.id !== id);
  }
  updateAgendaItem(
    id: number,
    field: 'title'|'presenter'|'duration'|'documents',
    value: any
  ): void {
    this.agendaItems = this.agendaItems.map(i =>
      i.id === id ? { ...i, [field]: value } : i
    );
  }
  removeAgendaItemDoc(itemId: number, docIndex: number): void {
    const item = this.agendaItems.find(i => i.id === itemId);
    if (!item) return;
    const docs = item.documents.filter((_, idx) => idx !== docIndex);
    this.updateAgendaItem(itemId, 'documents', docs);
  }

  // Supporting docs tab
  removeUploadedDoc(index: number): void {
    this.uploadedDocs.splice(index, 1);
  }

  // Save / Save & Send
  handleSubmit(): void {
    console.log('Saving session', {
      id: this.sessionId,
      ...this.sessionData,
      date: this.date,
      attendees: this.selectedMembers,
      guests: this.guests,
      agenda: this.agendaItems,
      documents: this.uploadedDocs
    });
    this.router.navigate(['/sessions', this.sessionId]);
  }
  handleSaveAndSend(): void {
    console.log('Saving & sending notice for session', this.sessionId);
    this.router.navigate(['/sessions', this.sessionId]);
  }
}
