import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { AgendaService } from '../../../../services/agenda.service';
import { SessionService } from '../../../../services/session.service';
import { environment } from '../../../../../environments/environment';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Attendee { 
  id: string; 
  name: string; 
  position: string; 
  status: 'Present'|'Absent';
}

interface Task { 
  description: string; 
  assignee: string; 
  dueDate: string; 
}

interface AgendaItem {
  id: number;
  title: string;
  presenter: string;
  duration: number;
  actualDuration: number;
  notes: string;
  voting: { inFavor: number; against: number; abstain: number; result: string };
  tasks: Task[];
  supportingDocuments: SupportingDocument[];
}

interface SupportingDocument {
  id: string;
  filename: string;
  url: string;
}

interface Session {
  id: string; 
  number: string; 
  type: string; 
  date: string;
  time: string; 
  endTime: string; 
  status: string; 
  quorum: string;
  location: string; 
  modality: string; 
  description: string;
  attendees: Attendee[];
}

@Component({
  selector: 'app-session-minutes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LucideAngularModule
  ],
  templateUrl: './session-minutes.component.html',
  styleUrls: ['./session-minutes.component.scss']
})
export class SessionMinutesComponent implements OnInit {
  sessionId!: string;
  activeTab: 'preview'|'edit'|'settings' = 'preview';
  
  // Data properties
  session: Session | null = null;
  agenda: AgendaItem[] = [];
  totalDuration = 0;
  presentCount = 0;
  
  // API state
  isLoadingSession = false;
  isLoadingAgenda = false;
  sessionError: string | null = null;
  agendaError: string | null = null;
  
  // File upload
  selectedFiles: File[] = [];
  uploadProgress = 0;
  currentUploadingItem: number | null = null;

  // Minutes generation
  presentList = '';
  absentList = '';
  today = new Date();
  minutesContent = '';
  private originalContent = '';
  
  // Document settings
  organizationName = 'Board of Directors';
  documentTitle = 'MINUTES OF MEETING';
  includeMeetingDetails = true;
  includeAttendance = true;
  includeAgenda = true;
  includeNextMeeting = true;
  includeSignatures = true;
  paperSize = 'letter';
  orientation = 'portrait';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private sessionService: SessionService,
    private agendaService: AgendaService
  ) {}

  ngOnInit() {
    this.sessionId = this.route.snapshot.paramMap.get('id')!;
    
    // Load real data from APIs
    this.loadSession();
    this.loadAgenda();
  }

  // Load session data from API
  loadSession() {
    this.isLoadingSession = true;
    this.sessionError = null;
    
    this.sessionService.getSession(this.sessionId).subscribe({
      next: (data: any) => {
        // Transform the session data to our interface format
        this.session = this.transformSessionData(data);
        this.isLoadingSession = false;
        
        // After loading session, fetch attendees' details
        if (data.SessionAttendees && data.SessionAttendees.length > 0) {
          this.fetchAttendeeDetails(data.SessionAttendees);
        }
        
        // Update minutes after data is loaded
        this.updateMinutesContent();
      },
      error: (err: any) => {
        console.error('Failed to load session:', err);
        this.sessionError = 'Failed to load session data.';
        this.isLoadingSession = false;
      }
    });
  }
  
  // Transform backend session format to our interface
  transformSessionData(data: any): Session {
    return {
      id: data._id,
      number: data.number || 'N/A',
      type: data.type || 'Regular',
      date: data.date || 'N/A',
      time: data.time || 'N/A',
      endTime: data.endTime || 'N/A',
      status: data.status || 'Pending',
      quorum: data.quorum ? 'Achieved' : 'Not Achieved',
      location: data.location || 'N/A',
      modality: data.modality || 'N/A',
      description: data.description || '',
      attendees: [] // This will be populated by fetchAttendeeDetails
    };
  }
  
  // Fetch the details of all attendees
  fetchAttendeeDetails(sessionAttendees: any[]) {
    // If no attendees or API not ready, create placeholder attendees
    if (!sessionAttendees || sessionAttendees.length === 0) {
      if (this.session) {
        this.session.attendees = [
          { id: '1', name: 'John Doe', position: 'Chairperson', status: 'Present' },
          { id: '2', name: 'Jane Smith', position: 'Vice Chair', status: 'Present' }
        ];
        this.updateAttendanceLists();
      }
      return;
    }
    
    // Continue with normal API call if available
    const attendeePromises = sessionAttendees.map(attendee => {
      return this.http.get(`${environment.apiUrl}/users/${attendee.Attendee}`).toPromise();
    });
    
    Promise.all(attendeePromises)
      .then((users: any[]) => {
        if (this.session) {
          this.session.attendees = users.map((user, index) => ({
            id: user._id,
            name: `${user.name || ''} ${user.apellidos || ''}`.trim(),
            position: user.position || 'Member',
            status: sessionAttendees[index].Asistio ? 'Present' : 'Absent'
          }));
          this.updateAttendanceLists();
        }
      })
      .catch(err => {
        console.error('Failed to load attendee details:', err);
        // Fallback to placeholder attendees on error
        if (this.session) {
          this.session.attendees = [
            { id: '1', name: 'John Doe', position: 'Chairperson', status: 'Present' },
            { id: '2', name: 'Jane Smith', position: 'Vice Chair', status: 'Present' }
          ];
          this.updateAttendanceLists();
        }
      });
  }
  
  // Helper method to update attendance lists
  updateAttendanceLists() {
    if (!this.session) return;
    
    this.presentCount = this.session.attendees.filter(a => a.status === 'Present').length;
    
    this.presentList = this.session.attendees
      .filter(a => a.status === 'Present')
      .map(a => `${a.name} (${a.position})`)
      .join('; ');
      
    this.absentList = this.session.attendees
      .filter(a => a.status === 'Absent')
      .map(a => `${a.name} (${a.position})`)
      .join('; ');
      
    this.updateMinutesContent();
  }
  
  // Load agenda data from API
  loadAgenda() {
    this.isLoadingAgenda = true;
    this.agendaError = null;
    
    this.agendaService.getAgenda(this.sessionId).subscribe({
      next: (data: any) => {
        // Transform agenda data to our interface format
        this.transformAgendaData(data);
        this.isLoadingAgenda = false;
        this.updateMinutesContent();
      },
      error: (err) => {
        console.error('Failed to load agenda:', err);
        this.agendaError = 'Failed to load agenda data.';
        this.isLoadingAgenda = false;
      }
    });
  }
  
  // Transform backend agenda format to our interface
  transformAgendaData(data: any) {
    if (!data || !data.SessionAgenda) {
      this.agenda = [];
      return;
    }
    
    this.agenda = data.SessionAgenda.map((item: any) => {
      return {
        id: item.Orden,
        title: item.Titulo,
        presenter: item.Presenter,
        duration: item.EstimatedTime || 0,
        actualDuration: item.Duration || 0,
        notes: item.Notas || '',
        voting: {
          inFavor: item.Pro || 0,
          against: item.Against || 0,
          abstain: 0,
          result: this.determineVotingResult(item.Pro || 0, item.Against || 0)
        },
        tasks: (item.Actions || []).map((action: any) => ({
          description: action.Descripcion || '',
          assignee: action.Assignee || 'Unassigned',
          dueDate: action.DueDate || 'Not specified'
        })),
        supportingDocuments: [] // Just initialize with empty array for now
      };
    });
    
    this.totalDuration = this.agenda.reduce((sum, a) => sum + a.actualDuration, 0);
  }
  
  // Determine voting result based on counts
  determineVotingResult(pro: number, against: number): string {
    if (pro === 0 && against === 0) return 'No Vote';
    return pro > against ? 'Approved' : 'Rejected';
  }
  
  // Update minutes content when data changes
  updateMinutesContent() {
    this.originalContent = this.generateMarkdown();
    this.minutesContent = this.originalContent;
  }


  
  // Add a new agenda item
  addAgendaItem(item: any) {
    const newItem = {
      Titulo: item.title,
      Duration: item.actualDuration || 0,
      Presenter: item.presenter,
      Notas: item.notes || '',
      EstimatedTime: item.duration || 0,
      Pro: item.voting?.inFavor || 0,
      Against: item.voting?.against || 0,
      Actions: (item.tasks || []).map((task: Task) => ({
        TipoAccion: 'Task',
        Descripcion: task.description,
        Assignee: task.assignee,
        DueDate: task.dueDate
      }))
    };
    
    this.agendaService.addAgendaItem(this.sessionId, newItem).subscribe({
      next: (result) => {
        this.transformAgendaData(result);
        this.updateMinutesContent();
        
        // Handle file uploads if any
        if (this.selectedFiles.length > 0 && result.SessionAgenda) {
          const lastItemOrder = result.SessionAgenda[result.SessionAgenda.length - 1].Orden;
          //this.uploadSupportingDocuments(lastItemOrder);
        }
      },
      error: (err) => {
        console.error('Failed to add agenda item:', err);
        this.agendaError = 'Failed to add agenda item.';
      }
    });
  }
  
  // Update an existing agenda item
  updateAgendaItem(id: number, updates: any) {
    const itemUpdates = {
      Titulo: updates.title,
      Duration: updates.actualDuration || 0,
      Presenter: updates.presenter,
      Notas: updates.notes || '',
      EstimatedTime: updates.duration || 0,
      Pro: updates.voting?.inFavor || 0,
      Against: updates.voting?.against || 0,
      Actions: (updates.tasks || []).map((task: Task) => ({
        TipoAccion: 'Task',
        Descripcion: task.description,
        Assignee: task.assignee,
        DueDate: task.dueDate
      }))
    };
    
    this.agendaService.updateAgendaItem(this.sessionId, id, itemUpdates).subscribe({
      next: (result) => {
        this.transformAgendaData(result);
        this.updateMinutesContent();
      },
      error: (err) => {
        console.error('Failed to update agenda item:', err);
        this.agendaError = 'Failed to update agenda item.';
      }
    });
  }
  
  // Delete an agenda item
  deleteAgendaItem(id: number) {
    if (confirm('Are you sure you want to delete this agenda item?')) {
      this.agendaService.deleteAgendaItem(this.sessionId, id).subscribe({
        next: (result) => {
          this.transformAgendaData(result);
          this.updateMinutesContent();
        },
        error: (err) => {
          console.error('Failed to delete agenda item:', err);
          this.agendaError = 'Failed to delete agenda item.';
        }
      });
    }
  }
  
  // File handling methods
  
  // Comment out these methods for now

// // Handle file selection
// onFileSelected(event: Event, itemId: number) {
//   // Implementation hidden for now
// }

// // Upload supporting documents for an agenda item
// uploadSupportingDocuments(itemId: number) {
//   // Implementation hidden for now
// }

// // Delete a supporting document
// deleteDocument(agendaItemId: number, docId: string) {
//   // Implementation hidden for now
// }
  
  // UI control methods
  setActiveTab(tab: 'preview'|'edit'|'settings') {
    this.activeTab = tab;
  }
  
  handlePrint() { 
    window.print(); 
  }
  
  handleDownloadPDF() { 
    // Get the printable element
    const printableElement = document.querySelector('.printable');
    
    if (!printableElement) {
      console.error('Could not find printable element');
      return;
    }

    // Show loading indicator or message
    const loadingMessage = document.createElement('div');
    loadingMessage.textContent = 'Preparing PDF...';
    loadingMessage.style.position = 'fixed';
    loadingMessage.style.top = '50%';
    loadingMessage.style.left = '50%';
    loadingMessage.style.transform = 'translate(-50%, -50%)';
    loadingMessage.style.padding = '10px 20px';
    loadingMessage.style.background = 'rgba(0,0,0,0.7)';
    loadingMessage.style.color = 'white';
    loadingMessage.style.borderRadius = '5px';
    loadingMessage.style.zIndex = '9999';
    document.body.appendChild(loadingMessage);

    // Set a timeout to allow the loading message to render
    setTimeout(() => {
      // Configure html2canvas
      html2canvas(printableElement as HTMLElement, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: -window.scrollY // Handle scrolling
      }).then(canvas => {
        // Create PDF with proper orientation and size
        const pdf = new jsPDF({
          orientation: this.orientation,
          unit: 'mm',
          format: this.paperSize
        });
        
        // Get PDF dimensions
        const imgWidth = pdf.internal.pageSize.getWidth();
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Calculate number of pages needed
        const pageHeight = pdf.internal.pageSize.getHeight();
        let heightLeft = imgHeight;
        let position = 0;
        let pageNumber = 1;
        
        // Add first page image
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        // Add additional pages if content is long
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pageNumber++;
          pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
        
        // Generate filename
        const fileName = `Minutes-${this.session?.number || 'Session'}-${new Date().toISOString().slice(0,10)}.pdf`;
        
        // Save the PDF
        pdf.save(fileName);
        
        // Remove loading message
        document.body.removeChild(loadingMessage);
      });
    }, 100);
  }
  
  resetToOriginal() { 
    this.minutesContent = this.originalContent; 
  }
  
  saveChanges() { 
    console.log('Saved:', this.minutesContent); 
    // Implement saving logic
  }
  
  applySettings() {
    console.log('Settings applied');
    this.updateMinutesContent();
  }

  // Generate markdown for minutes
  private generateMarkdown(): string {
    if (!this.session) return '';
    
    let md = `# ${this.documentTitle}\n\n`;
    md += `## ${this.organizationName}\n\n`;
    
    if (this.includeMeetingDetails) {
      md += `**Meeting Number:** ${this.session.number}\n`;
      md += `**Date:** ${this.session.date}\n`;
      md += `**Time:** ${this.session.time} to ${this.session.endTime}\n`;
      md += `**Location:** ${this.session.location}\n`;
      md += `**Modality:** ${this.session.modality}\n\n`;
    }
    
    if (this.includeAttendance) {
      md += `## Attendance\n\n`;
      md += `**Present:** ${this.presentList || 'None'}\n\n`;
      md += `**Absent:** ${this.absentList || 'None'}\n\n`;
    }
    
    if (this.includeAgenda && this.agenda.length > 0) {
      md += `## Agenda Items\n\n`;
      
      this.agenda.forEach(item => {
        md += `### ${item.id}. ${item.title}\n\n`;
        md += `**Presenter:** ${item.presenter}\n`;
        md += `**Duration:** ${item.actualDuration} minutes\n\n`;
        
        if (item.notes) {
          md += `**Notes:** ${item.notes}\n\n`;
        }
        
        if (item.voting.inFavor > 0 || item.voting.against > 0) {
          md += `**Voting Results:** ${item.voting.inFavor} in favor, ${item.voting.against} against. ${item.voting.result}.\n\n`;
        }
        
        if (item.tasks && item.tasks.length > 0) {
          md += `**Action Items:**\n\n`;
          item.tasks.forEach(task => {
            md += `- ${task.description} (Assigned to: ${task.assignee}, Due: ${task.dueDate})\n`;
          });
          md += '\n';
        }
        
        if (item.supportingDocuments && item.supportingDocuments.length > 0) {
          md += `**Supporting Documents:**\n\n`;
          item.supportingDocuments.forEach(doc => {
            md += `- [${doc.filename}](${doc.url})\n`;
          });
          md += '\n';
        }
      });
    }
    
    if (this.includeNextMeeting) {
      md += `## Next Meeting\n\n`;
      md += `To be determined\n\n`;
    }
    
    if (this.includeSignatures) {
      md += `## Signatures\n\n`;
      md += `Chairperson: _______________________\n\n`;
      md += `Secretary: _______________________\n\n`;
    }
    
    return md;
  }
}
