import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

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
export class SessionNewComponent {
  activeTab: 'details'|'attendees'|'agenda'|'documents' = 'details';
  date?: string;

  // form state
  sessionData = {
    number: '',
    type: 'ordinary',
    time: '10:00',
    modality: 'in-person',
    location: '',
    description: '',
  };

  // members & attendees
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
  selectedMembers = this.members.map(m => m.id);

  // ** Guest state **
  guests: Array<{ id: number; name?: string; email: string }> = [];
  newGuestName = '';
  newGuestEmail = '';
  showGuestModal = false;
  private nextGuestId = 1;

  // agenda items
  agendaItems: Array<{
    id: number;
    title: string;
    presenter: string;
    duration: number;
    documents: string[];
  }> = [
    { id: 1, title: '', presenter: '', duration: 15, documents: [] }
  ];

  // helper arrays
  durations = [5,10,15,20,30,45,60];

  // tab helper
  isTab(tab: string) { return this.activeTab === tab; }

  // attendees helpers
  selectAll()   { this.selectedMembers = this.members.map(m => m.id); }
  deselectAll() { this.selectedMembers = []; }
  toggleMember(id: number) {
    this.selectedMembers = this.selectedMembers.includes(id)
      ? this.selectedMembers.filter(x => x !== id)
      : [...this.selectedMembers, id];
  }

  // ** Guest helpers **
  openGuestModal() {
    this.showGuestModal = true;
  }
  closeGuestModal() {
    this.showGuestModal = false;
    this.newGuestName = '';
    this.newGuestEmail = '';
  }
  addGuest() {
    if (!this.newGuestEmail.trim()) return;
    this.guests.push({
      id: this.nextGuestId++,
      name: this.newGuestName.trim(),
      email: this.newGuestEmail.trim()
    });
    this.closeGuestModal();
  }
  removeGuest(id: number) {
    this.guests = this.guests.filter(g => g.id !== id);
  }

  // agenda helpers
  addAgendaItem() {
    const nextId = this.agendaItems.length
      ? Math.max(...this.agendaItems.map(i => i.id)) + 1
      : 1;
    this.agendaItems.push({
      id: nextId,
      title: '',
      presenter: '',
      duration: 15,
      documents: []
    });
  }
  removeAgendaItem(id: number) {
    if (this.agendaItems.length > 1) {
      this.agendaItems = this.agendaItems.filter(i => i.id !== id);
    }
  }
  updateAgendaItem(id: number, field: keyof typeof this.agendaItems[0], value: any) {
    this.agendaItems = this.agendaItems.map(i =>
      i.id === id ? { ...i, [field]: value } : i
    );
  }

  // final actions
  constructor(private router: Router) {}
  handleSubmit() {
    console.log('Creating new session', {
      ...this.sessionData,
      date: this.date,
      attendees: this.selectedMembers,
      guests: this.guests,
      agenda: this.agendaItems
    });
    this.router.navigate(['/sessions']);
  }
  handleSaveAndSend() {
    console.log('Creating new session & sending notice', {
      ...this.sessionData,
      date: this.date,
      attendees: this.selectedMembers,
      guests: this.guests,
      agenda: this.agendaItems
    });
    this.router.navigate(['/sessions']);
  }
}
