import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
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
  sessionError: string | null = null;
  
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
  orientation: 'portrait' | 'p' | 'landscape' | 'l' = 'portrait';

  // Add this to your SessionMinutesComponent class properties
  attendees: Attendee[] = [];

  // Add these properties if they don't exist
  loading: boolean = true;
  error: string | null = null;

  // Add these properties
  preparedBy: string = '';
  approvedBy: string = '';
  approvalDate: string = '';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private sessionService: SessionService
  ) {}

  ngOnInit(): void {
    // Add debugging to see if this is being called
    console.log('SessionMinutesComponent initialized');

    this.route.params.subscribe(params => {
      const sessionId = params['id'];
      console.log('Session ID from route:', sessionId);

      if (sessionId) {
        this.loadSessionData(sessionId);
      } else {
        console.error('No session ID provided in route');
      }
    });
  }

  loadSessionData(sessionId: string): void {
    this.loading = true;
    this.error = null;
    this.sessionId = sessionId;
    
    console.log('Attempting to load session with ID:', sessionId);
    console.log('API URL being called:', `${environment.apiUrl}/sessions/${sessionId}`);
    
    this.sessionService.getSession(sessionId).subscribe({
      next: (data) => {
        console.log('SUCCESS - Session data received:', data);
        
        // Transform session data
        this.session = this.transformSessionData(data);
        
        // Extract and transform agenda data directly from the session
        if (data.agenda && data.agenda.length > 0) {
          this.transformAgendaData(data.agenda);
        } else {
          this.agenda = [];
        }
        
        // If session has attendees, process them
        if (data.attendees && data.attendees.length > 0) {
          this.processAttendees(data.attendees);
        } else {
          this.attendees = [];
        }
        
        // Update generated minutes content
        this.updateMinutesContent();
        
        this.loading = false;
      },
      error: (err) => {
        console.error('ERROR loading session:', err);
        console.error('Error status:', err.status);
        console.error('Error message:', err.message);
        console.error('Error details:', err.error);
        this.error = 'Failed to load session data. Please try again later.';
        this.loading = false;
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
      attendees: [] // This will be populated separately
    };
  }
  
  // Process attendees directly from session data
  processAttendees(attendeeData: any[]) {
    // Simple processing - in a real app you might fetch more user details
    this.attendees = attendeeData.map(att => ({
      id: att._id || att.memberId,
      name: att.memberId, // Ideally you would fetch the full name from user service
      position: att.role || 'Member',
      status: att.status === 'confirmed' ? 'Present' : 'Absent'
    }));
    
    // Update attendee counters and lists
    this.updateAttendanceLists();
  }
  
  // Helper method to update attendance lists
  updateAttendanceLists() {
    if (!this.session) return;
    
    this.presentCount = this.attendees.filter(a => a.status === 'Present').length;
    
    this.presentList = this.attendees
      .filter(a => a.status === 'Present')
      .map(a => `${a.name} (${a.position})`)
      .join('; ');
      
    this.absentList = this.attendees
      .filter(a => a.status === 'Absent')
      .map(a => `${a.name} (${a.position})`)
      .join('; ');
      
    this.session.attendees = this.attendees;
  }
  
  // Transform backend agenda format to our interface
  transformAgendaData(agendaData: any[]) {
    this.agenda = agendaData.map((item: any) => {
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
          assignee: action.Responsable || 'Unassigned',
          dueDate: action.DueDate || 'Not specified'
        })),
        supportingDocuments: (item.SupportingDocuments || []).map((doc: any) => ({
          id: doc._id || '',
          filename: doc.filename || 'Unnamed document',
          url: doc.url || '#'
        }))
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

    // Show loading indicator
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

    setTimeout(() => {
      // Configure html2canvas
      html2canvas(printableElement as HTMLElement, {
        scale: 2, 
        useCORS: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: -window.scrollY 
      }).then(canvas => {
        // Create PDF
        const pdf = new jsPDF({
          orientation: this.orientation as ('portrait' | 'p' | 'landscape' | 'l'),
          unit: 'mm',
          format: this.paperSize
        });
        
        // Get PDF dimensions
        const imgWidth = pdf.internal.pageSize.getWidth();
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Calculate number of pages
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
        
        // Remove loading indicator
        document.body.removeChild(loadingMessage);
        
        // Save PDF directly
        pdf.save(fileName);
      });
    }, 100);
  }
  
  resetToOriginal() { 
    this.minutesContent = this.originalContent; 
  }
  
  saveChanges() { 
    console.log('Saving changes to minutes content');
    
    // Create a document object
    const minutesDocument = {
      sessionId: this.sessionId,
      content: this.minutesContent,
      version: new Date().toISOString(),
      preparedBy: this.preparedBy,
      approvedBy: this.approvedBy,
      approvalDate: this.approvalDate
    };
    
    // Save to local storage for now
    localStorage.setItem(`minutes-${this.sessionId}`, JSON.stringify(minutesDocument));
    
    // Show success message
    alert('Minutes content saved successfully!');
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
          md += `${item.notes}\n\n`;
        }
        
        // Add voting information
        md += `**Voting:** ${item.voting.inFavor} in favor, ${item.voting.against} against - ${item.voting.result}\n\n`;
        
        // Add tasks if any
        if (item.tasks && item.tasks.length > 0) {
          md += `**Tasks:**\n`;
          item.tasks.forEach(task => {
            md += `- ${task.description} (Assigned to: ${task.assignee}, Due: ${task.dueDate})\n`;
          });
          md += `\n`;
        }
      });
    }
    
    // Add next meeting section
    if (this.includeNextMeeting) {
      md += `## Next Meeting\n\n`;
      md += `The next meeting is scheduled for May 31, 2025 at 10:00 AM.\n\n`;
    }
    
    // Add signatures section
    if (this.includeSignatures) {
      md += `## Signatures\n\n`;
      md += `Minutes Prepared By: _______________________\n\n`;
      md += `Approved By: _______________________\n\n`;
      md += `Date: _______________________\n`;
    }
    
    return md;
  }
}
