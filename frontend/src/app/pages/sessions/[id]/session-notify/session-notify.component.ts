import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { RouterModule, ActivatedRoute, Router } from '@angular/router'
import { LucideAngularModule } from 'lucide-angular'
import { Calendar, Clock, MapPin, Video, FileText, Send, AlertCircle } from 'lucide-angular'

@Component({
  selector: 'app-session-notify',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    LucideAngularModule
  ],
  templateUrl: './session-notify.component.html',
  styleUrls: ['./session-notify.component.scss']
})
export class SessionNotifyComponent {
  sessionId: string
  session: {
    id: string,
    number: string,
    type: string,
    date: string,
    time: string,
    modality: string,
    location: string,
    description: string
  }
  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.sessionId = this.route.snapshot.paramMap.get('id') || ''
    // -- mock session data --
    this.session = {
      id: this.sessionId,
      number: '001',
      type: 'Ordinary',
      date: '2025-05-15',
      time: '10:00 AM',
      modality: 'In Person',
      location: 'Board Room A, Main Building',
      description: 'Regular monthly board meeting to discuss ongoing projects and financial updates.'
    }
  }

  attendees = [
    { id:1, name:'John Doe',       email:'john.doe@example.com',       status:'Confirmed' },
    { id:2, name:'Jane Smith',     email:'jane.smith@example.com',     status:'Confirmed' },
    { id:3, name:'Robert Johnson', email:'robert.johnson@example.com', status:'Pending'   },
    { id:4, name:'Emily Davis',    email:'emily.davis@example.com',    status:'Confirmed' },
    { id:5, name:'Michael Wilson', email:'michael.wilson@example.com', status:'Declined'  },
    { id:6, name:'Sarah Thompson', email:'sarah.thompson@example.com', status:'Pending'   },
    { id:7, name:'David Martinez', email:'david.martinez@example.com', status:'Confirmed' },
    { id:8, name:'Jennifer Garcia',email:'jennifer.garcia@example.com',status:'Pending'   },
  ]

  guests = [
    { id:1, name:'External Consultant', email:'consultant@external.com' },
    { id:2, name:'',                  email:'guest@company.com'       }
  ]

  agenda = [
    { id:1, title:'Approval of Previous Minutes', presenter:'John Doe',       duration:10 },
    { id:2, title:'Financial Report Q1 2025',     presenter:'Emily Davis',    duration:20 },
    { id:3, title:'Strategic Plan Update',        presenter:'Jane Smith',     duration:30 },
    { id:4, title:'New Project Proposals',        presenter:'David Martinez', duration:20 },
    { id:5, title:'Any Other Business',           presenter:'John Doe',       duration:10 },
  ]

  documents = [
    { id:1, name:'previous_minutes.pdf',        size:'1.2 MB' },
    { id:2, name:'financial_report_q1_2025.pdf',size:'3.5 MB' },
    { id:3, name:'budget_comparison.xlsx',      size:'0.8 MB' },
    { id:4, name:'strategic_plan_update.pptx',  size:'5.2 MB' },
    { id:5, name:'project_proposals.pdf',       size:'2.7 MB' },
  ]

  // -- selection state --
  selectedRecipients = this.attendees.filter(a => a.status==='Pending').map(a => a.id)
  selectedGuests     = this.guests.map(g => g.id)

  includeAgenda        = true
  includeDocuments     = true
  includeAbsenceForm   = true

  activeTab: 'members'|'guests' = 'members'

  toggleRecipient(id: number) {
    const i = this.selectedRecipients.indexOf(id)
    if (i >= 0) this.selectedRecipients.splice(i,1)
    else         this.selectedRecipients.push(id)
    this.selectedRecipients = [...this.selectedRecipients]
  }

  toggleGuest(id: number) {
    const i = this.selectedGuests.indexOf(id)
    if (i >= 0) this.selectedGuests.splice(i,1)
    else         this.selectedGuests.push(id)
    this.selectedGuests = [...this.selectedGuests]
  }

  selectAll() {
    this.selectedRecipients = this.attendees.map(a => a.id)
    this.selectedGuests     = this.guests.map(g => g.id)
  }
  selectNone() {
    this.selectedRecipients = []
    this.selectedGuests     = []
  }
  selectPending() {
    this.selectedRecipients = this.attendees.filter(a=>a.status==='Pending').map(a=>a.id)
    this.selectedGuests     = []
  }

  handleSendNotification() {
    console.log('Notify members:', this.selectedRecipients)
    console.log('Notify guests:',  this.selectedGuests)
    this.router.navigate(['/sessions', this.session.id])
  }

  // computed email text
  get emailSubject() {
    return `Meeting Notice: Board Session #${this.session.number} - ${this.session.date}`
  }

  get memberEmailBody() {
    const { number, type, date, time, location, modality, description } = this.session
    let body = `Dear [Member Name],\n\nThis is a notice for the upcoming board meeting:\n\n`
    body += `Session: #${number} - ${type}\nDate: ${date}\nTime: ${time}\nLocation: ${location}\nModality: ${modality}\n\n`
    body += `${description}\n\nPlease confirm your attendance by clicking the link below.\n\n`
    if (this.includeAbsenceForm) {
      body += `If unable to attend, fill out the absence justification form attached.\n\n`
    }
    if (this.includeAgenda) {
      body += `Agenda:\n`
      this.agenda.forEach((it,i)=> body += `${i+1}. ${it.title} (${it.duration} min) - Presenter: ${it.presenter}\n`)
      body += `\n`
    }
    if (this.includeDocuments) {
      body += `Supporting documents are attached.\n\n`
    }
    body += `Best regards,\n[Sender Name]\n[Organization]\n`
    return body
  }

  get guestEmailBody() {
    const { number, type, date, time, location, modality, description } = this.session
    let body = `Dear Guest,\n\nYou are invited as a guest to our board meeting:\n\n`
    body += `Session: #${number} - ${type}\nDate: ${date}\nTime: ${time}\nLocation: ${location}\nModality: ${modality}\n\n`
    body += `${description}\n\n`
    if (this.includeAgenda) {
      body += `Agenda:\n`
      this.agenda.forEach((it,i)=> body += `${i+1}. ${it.title} (${it.duration} min) - Presenter: ${it.presenter}\n`)
      body += `\n`
    }
    if (this.includeDocuments) {
      body += `Relevant documents are attached for your reference.\n\n`
    }
    body += `Best regards,\n[Sender Name]\n[Organization]\n`
    return body
  }
}
