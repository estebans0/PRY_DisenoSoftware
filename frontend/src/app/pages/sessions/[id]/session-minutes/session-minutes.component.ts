// src/app/pages/sessions/[id]/session-minutes/session-minutes.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

interface SupportingDocument {
  id: string;
  filename: string;
  url: string;
}

interface AgendaItem {
  id: number;
  title: string;
  presenter: string;
  duration: number;
  actualDuration: number;
  notes: string;                                        // ← now actually populated
  tipoPunto: string;                                    // ← add agenda item type
  responsible?: {                                       // ← add responsible person
    name: string;
    email: string;
  };
  voting: { inFavor: number; against: number; abstain: number; result: string };
  tasks: Task[];
  supportingDocuments: SupportingDocument[];
}

interface Session {
  id: string;
  number: string;
  type: string;
  date: string;
  time: string;
  startTime: string;
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
    LucideAngularModule,
  ],
  templateUrl: './session-minutes.component.html',
  styleUrls: ['./session-minutes.component.scss']
})
export class SessionMinutesComponent implements OnInit {
  sessionId!: string;
  activeTab: 'preview'|'edit'|'settings' = 'preview';

  session: Session | null = null;
  attendees: Attendee[] = [];
  agenda: AgendaItem[] = [];
  totalDuration = 0;
  presentCount = 0;
  presentList = '';
  absentList = '';
  today = new Date();
  minutesContent = '';
  private originalContent = '';

  // file-upload + UI
  selectedFiles: File[] = [];
  uploadProgress = 0;
  currentUploadingItem: number | null = null;
  loading = true;
  error: string | null = null;

  // settings
  organizationName = 'Board of Directors';
  documentTitle = 'MINUTES OF MEETING';
  includeMeetingDetails = true;
  includeAttendance = true;
  includeAgenda = true;
  includeNextMeeting = true;
  includeSignatures = true;
  paperSize = 'letter';
  orientation: 'portrait'|'landscape' = 'portrait';
  preparedBy = '';
  approvedBy = '';
  approvalDate = '';

  constructor(
    private route: ActivatedRoute,
    private sessionService: SessionService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) this.loadSessionData(id);
      else this.error = 'No session ID in route';
    });
  }

  private loadSessionData(id: string) {
    this.loading = true;
    this.error = null;
    this.sessionId = id;

    this.sessionService.getSession(id).subscribe({
      next: data => {
        // session header
        this.session = {
          id:          data._id!,
          number:      data.number,
          type:        data.type,
          date:        data.date,
          time:        data.time,
          startTime:   data.startTime || '',
          endTime:     data.endTime   || '',
          status:      data.status,
          quorum:      data.quorum,
          location:    data.location,
          modality:    data.modality!,
          description: data.description || '',
          attendees:   []
        };

        // attendees
        this.attendees = (data.attendees || []).map(a => ({
          id:       a._id,
          name:     a.name,
          position: a.role,
          status:   a.status === 'Confirmed' ? 'Present' : 'Absent'
        }));
        this.updateAttendanceLists();

        // agenda items
        this.agenda = (data.agenda || []).map((item: any) => {
          const inFav = (item.pro || []).length;
          const agn   = (item.against || []).length;
          const abst  = (item.abstained || []).length;
          return {
            id:               item.order,
            title:            item.title,
            presenter:        item.presenter,
            duration:         item.duration,
            actualDuration:   item.estimatedTime,
            notes:            item.notes || '',             // ← HERE we pull in the saved notes
            tipoPunto:        item.tipoPunto || 'informativa', // ← add agenda item type
            responsible:      item.responsible || null,     // ← add responsible person
            voting: {
              inFavor: inFav,
              against: agn,
              abstain: abst,
              result:  item.decision || this.determineVotingResult(inFav, agn)
            },
            tasks: (item.actions || []).map((t: any) => ({
              description: t.description,
              assignee:    t.assignee.name,
              dueDate:     t.dueDate
                              ? new Date(t.dueDate).toLocaleDateString()
                              : 'N/A'
            })),
            supportingDocuments: (item.documents || []).map((d: any) => ({
              id:       d._id,
              filename: d.fileName,
              url:      `${environment.apiUrl}/uploads/${d.filePath}`
            }))
          };
        });
        this.totalDuration = this.agenda
          .map(i => i.actualDuration)
          .reduce((sum, v) => sum + v, 0);

        // now build the markdown + html preview
        this.updateMinutesContent();
        this.loading = false;
      },
      error: err => {
        console.error(err);
        this.error = 'Failed to load session data.';
        this.loading = false;
      }
    });
  }

  private updateAttendanceLists() {
    this.presentCount = this.attendees.filter(a => a.status==='Present').length;
    this.presentList = this.attendees
      .filter(a => a.status==='Present')
      .map(a => `${a.name} (${a.position})`)
      .join('; ') || 'None';
    this.absentList = this.attendees
      .filter(a => a.status==='Absent')
      .map(a => `${a.name} (${a.position})`)
      .join('; ') || 'None';
    if (this.session) this.session.attendees = this.attendees;
  }

  private determineVotingResult(pro: number, against: number) {
    if (pro===0 && against===0) return 'No Vote';
    if (pro > against) return 'Approved';
    if (against > pro) return 'Rejected';
    return 'Deferred';
  }

  // ─── Preview / Edit / Settings ───

  setActiveTab(tab: 'preview'|'edit'|'settings') {
    this.activeTab = tab;
    if (tab==='preview') this.updateMinutesContent();
  }

  private updateMinutesContent() {
    this.originalContent = this.generateMarkdown();
    this.minutesContent  = this.originalContent;
  }

  resetToOriginal() { this.minutesContent = this.originalContent; }

  saveChanges() {
    const doc = {
      sessionId:    this.sessionId,
      content:      this.minutesContent,
      preparedBy:   this.preparedBy,
      approvedBy:   this.approvedBy,
      approvalDate: this.approvalDate
    };
    localStorage.setItem(`minutes-${this.sessionId}`, JSON.stringify(doc));
    alert('Minutes saved locally.');
  }

  applySettings() {
    this.updateMinutesContent();
    this.activeTab = 'preview';
  }

  // ─── Print / PDF ───

  handlePrint() { window.print(); }

  handleDownloadPDF() {
    const element = document.querySelector('.printable') as HTMLElement;
    if (!element) return alert('Nothing to print');
    html2canvas(element, { scale:2 }).then(canvas => {
      const pdf = new jsPDF({
        orientation: this.orientation,
        unit: 'mm',
        format: this.paperSize
      });
      const imgData = canvas.toDataURL('image/png');
      const imgW = pdf.internal.pageSize.getWidth();
      const imgH = (canvas.height * imgW) / canvas.width;
      pdf.addImage(imgData,'PNG',0,0,imgW,imgH);
      pdf.save(`Minutes-${this.session?.number}.pdf`);
    });
  }

  // ─── Markdown generator ───

  private generateMarkdown(): string {
    if (!this.session) return '';
    let md = `# ${this.documentTitle}\n\n## ${this.organizationName}\n\n`;

    if (this.includeMeetingDetails) {
      md += `**Session #** ${this.session.number}\n\n`;
      md += `**Date:**   ${this.session.date}\n\n`;
      md += `**Time:**   ${this.session.time} to ${this.session.endTime}\n\n`;
      md += `**Location:** ${this.session.location} (${this.session.modality})\n\n`;
      md += `**Quorum:**   ${this.session.quorum} (${this.presentCount} present)\n\n`;
    }

    if (this.includeAttendance) {
      md += `## Attendance\n\n`;
      md += `**Present:** ${this.presentList}\n\n`;
      md += `**Absent:**  ${this.absentList}\n\n`;
    }

    if (this.includeAgenda && this.agenda.length) {
      md += `## Agenda & Discussions\n\n`;
      this.agenda.forEach((it, idx) => {
        md += `### ${idx+1}. ${it.title}\n\n`;
        md += `- Presenter: ${it.presenter}\n`;
        md += `- Duration:  ${it.actualDuration} minutes\n\n`;
        // now include the saved notes under “Discussion:”
        if (it.notes) {
          md += `**Discussion:**\n${it.notes}\n\n`;
        }
        md += `**Voting:**   ${it.voting.inFavor} in favor, ${it.voting.against} against, ${it.voting.abstain} abstain\n\n`;
        md += `**Decision:** ${it.voting.result}\n\n`;
        if (it.tasks.length) {
          md += `**Action Items:**\n`;
          it.tasks.forEach(t => {
            md += `- ${t.description} (Assigned to ${t.assignee}, Due ${t.dueDate})\n`;
          });
          md += `\n`;
        }
      });
    }

    if (this.includeNextMeeting) {
      md += `## Next Meeting\n\nNext meeting scheduled for May 31, 2025 at 10:00 AM.\n\n`;
    }

    if (this.includeSignatures) {
      md += `## Signatures\n\n`;
      md += `- Minutes Prepared By: ${this.preparedBy   || '________________'}\n`;
      md += `- Approved By:       ${this.approvedBy   || '________________'}\n`;
      md += `- Approval Date:     ${this.approvalDate|| '________________'}\n`;
    }

    return md;
  }
}
