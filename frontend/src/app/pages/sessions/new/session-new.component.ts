import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { SessionService } from '../../../services/session.service';
import { MemberService }  from '../../../services/member.service';

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
  members: any[] = [];  // Lista de miembros desde la API
  selectedMembers: number[] = [];

  // form state
  sessionData = {
    number: '',
    type: 'ordinary',
    time: '10:00',
    modality: 'in-person',
    location: '',
    description: '',
  };

  // Hay que adaptar esto para que haga un fetch a la API y obtenga los miembros
  ngOnInit() {
    this.memberSvc.list().subscribe({
      next: (data) => {
        this.members = data.map(member => ({
          name: member.firstName || 'Unknown',
          position: member.position || 'Not specified',
          email: member.email || 'No email'
        }));
        this.selectedMembers = this.members.map(m => m.name); // Seleccionar automáticamente
      },
      error: (err) => console.error('Error obteniendo miembros:', err)
    });
  }

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
  constructor(private router: Router, private sessionSvc: SessionService, private memberSvc: MemberService) {}
  handleSubmit() {
  const newSession = {
    ...this.sessionData,
    date: this.date,
    attendees: this.selectedMembers,
    guests: this.guests,
    agenda: this.agendaItems.map(item => ({
      Orden: item.id,  // Asegurar orden
      Titulo: item.title || 'Sin título',  // Evitar undefined
      Presenter: item.presenter || 'Desconocido', // Evitar undefined
      Duration: item.duration ?? 15, // Valor por defecto
      EstimatedTime: item.duration ?? 15, // Asignar tiempo estimado
    }))
  };

  // Validar antes de enviar
  if (!newSession.date || !newSession.attendees.length) {
    console.error('Error: La sesión requiere una fecha y asistentes.');
    return;
  }


  this.sessionSvc.createSession(newSession).subscribe({
    next: () => this.router.navigate(['/sessions']),
    error: (err) => console.error('Error creando sesión:', err)
  });
}

handleSaveAndSend() {
  const newSession = {
    ...this.sessionData,
    date: this.date,
    attendees: this.selectedMembers,
    guests: this.guests,
    agenda: this.agendaItems.map(item => ({
      Orden: item.id,
      Titulo: item.title || 'Sin título',
      Presenter: item.presenter || 'Desconocido',
      Duration: item.duration ?? 15,
      EstimatedTime: item.duration ?? 15,
    }))
  };

  this.sessionSvc.createSession(newSession).subscribe({
    next: (createdSession) => {
      console.log('Sesión creada, enviando notificación...');
      this.router.navigate(['/sessions']);
    },
    error: (err) => console.error('Error creando sesión:', err)
  });
}
}
