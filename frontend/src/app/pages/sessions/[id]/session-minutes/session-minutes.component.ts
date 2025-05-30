import { Component, OnInit } from '@angular/core';
import { CommonModule }     from '@angular/common';
import { FormsModule }      from '@angular/forms';
import { ActivatedRoute }   from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

interface Attendee { id: number; name: string; position: string; status: 'Present'|'Absent' }
interface Task      { description: string; assignee: string; dueDate: string; }
interface AgendaItem {
  id: number;
  title: string;
  presenter: string;
  duration: number;
  actualDuration: number;
  notes: string;
  voting: { inFavor: number; against: number; abstain: number; result: string };
  tasks: Task[];
}
interface Session {
  id: string; number: string; type: string; date: string;
  time: string; endTime: string; status: string; quorum: string;
  location: string; modality: string; description: string;
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

  session!: Session;
  attendees: Attendee[] = [];
  agenda: AgendaItem[] = [];
  totalDuration = 0;
  presentCount  = 0;

  // precomputed lists to avoid arrow‐functions in template
  presentList = '';
  absentList  = '';

  // for the sign‐off date
  today = new Date();

  // Edit tab
  minutesContent = '';
  private originalContent = '';

  // Settings tab
  organizationName      = 'Board of Directors';
  documentTitle         = 'MINUTES OF MEETING';
  includeMeetingDetails = true;
  includeAttendance     = true;
  includeAgenda         = true;
  includeNextMeeting    = true;
  includeSignatures     = true;
  paperSize             = 'letter';
  orientation           = 'portrait';

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.sessionId = this.route.snapshot.paramMap.get('id')!;

    // --- mock data ---
    this.session = {
      id: this.sessionId,
      number: 'S-2025-003',
      type: 'Ordinary',
      date: '2025-04-30',
      time: '10:00 AM',
      endTime: '11:45 AM',
      status: 'Completed',
      quorum: 'Achieved',
      location: 'Board Room A, Main Building',
      modality: 'In Person',
      description: 'Regular monthly board meeting to discuss ongoing projects and financial updates.'
    };
    this.attendees = [
      { id:1, name:'John Doe',       position:'Chairperson',      status:'Present' },
      { id:2, name:'Jane Smith',     position:'Vice Chairperson', status:'Present' },
      { id:3, name:'Robert Johnson', position:'Secretary',        status:'Present' },
      { id:4, name:'Emily Davis',    position:'Treasurer',        status:'Present' },
      { id:5, name:'Michael Wilson', position:'Board Member',     status:'Absent'  },
      { id:6, name:'Sarah Thompson', position:'Board Member',     status:'Present' },
      { id:7, name:'David Martinez', position:'Board Member',     status:'Present' },
      { id:8, name:'Jennifer Garcia',position:'Board Member',     status:'Absent'  },
    ];
    this.agenda = [
      {
        id:1, title:'Approval of Previous Minutes', presenter:'John Doe',
        duration:10, actualDuration: 8,
        notes:'The minutes from the previous meeting were reviewed and approved without amendments.',
        voting:{ inFavor:6, against:0, abstain:0, result:'Approved' },
        tasks:[]
      },
      {
        id:2, title:'Financial Report Q1 2025', presenter:'Emily Davis',
        duration:20, actualDuration:25,
        notes:
          'Emily presented the Q1 financial report. Revenue exceeded projections by 12%, while expenses were 5% under budget. The board discussed the allocation of the surplus to the technology infrastructure upgrade project.',
        voting:{ inFavor:5, against:1, abstain:0, result:'Approved' },
        tasks:[
          {
            description:'Prepare detailed budget for technology upgrade',
            assignee:'Emily Davis',
            dueDate:'2025-05-15'
          }
        ]
      },
      {
        id:3, title:'Strategic Plan Update', presenter:'Jane Smith',
        duration:30, actualDuration:35,
        notes:
          'Jane provided an update on the strategic plan implementation. Three of the five key initiatives are on track, while two are slightly behind schedule due to resource constraints. The board discussed potential solutions to address the delays.',
        voting:{ inFavor:0, against:0, abstain:0, result:'No Vote Required' },
        tasks:[
          { description:'Revise timeline for Initiative 4', assignee:'Jane Smith', dueDate:'2025-05-10' },
          { description:'Identify additional resources for Initiative 5', assignee:'John Doe', dueDate:'2025-05-20' }
        ]
      },
      {
        id:4, title:'New Project Proposals', presenter:'David Martinez',
        duration:20, actualDuration:22,
        notes:
          'David presented three new project proposals. After discussion, the board decided to approve Project A and Project C, while requesting additional information for Project B before making a decision.',
        voting:{ inFavor:4, against:2, abstain:0, result:'Approved with Conditions' },
        tasks:[
          { description:'Prepare implementation plan for Projects A and C', assignee:'David Martinez', dueDate:'2025-05-30' },
          { description:'Gather additional information for Project B',    assignee:'David Martinez', dueDate:'2025-05-15' }
        ]
      },
      {
        id:5, title:'Any Other Business', presenter:'John Doe',
        duration:10, actualDuration:5,
        notes:'No additional items were raised.',
        voting:{ inFavor:0, against:0, abstain:0, result:'No Vote Required' },
        tasks:[]
      }
    ];
    // ---------------------------------------

    this.totalDuration = this.agenda.reduce((sum,a)=> sum+a.actualDuration, 0);
    this.presentCount   = this.attendees.filter(a=>a.status==='Present').length;

    // precompute the strings
    this.presentList = this.attendees
      .filter(a=>a.status==='Present')
      .map(a=>`${a.name} (${a.position})`)
      .join('; ');
    this.absentList = this.attendees
      .filter(a=>a.status==='Absent')
      .map(a=>`${a.name} (${a.position})`)
      .join('; ');

    // setup edit‐tab content
    this.originalContent = this.generateMarkdown();
    this.minutesContent  = this.originalContent;
  }

  setActiveTab(tab: 'preview'|'edit'|'settings') {
    this.activeTab = tab;
  }
  handlePrint()         { window.print(); }
  handleDownloadPDF()   { console.log('Download PDF'); }
  resetToOriginal()     { this.minutesContent = this.originalContent; }
  saveChanges()         { console.log('Saved:', this.minutesContent); }
  applySettings()       { console.log('Settings:', {
                            org: this.organizationName,
                            title: this.documentTitle,
                            includeMeetingDetails: this.includeMeetingDetails,
                            includeAttendance: this.includeAttendance,
                            includeAgenda: this.includeAgenda,
                            includeNextMeeting: this.includeNextMeeting,
                            includeSignatures: this.includeSignatures,
                            paperSize: this.paperSize,
                            orientation: this.orientation
                          }); }

  private generateMarkdown(): string {
    const lines: string[] = [];
    const { session, attendees, agenda, totalDuration, presentCount } = this;

    lines.push(`# MINUTES OF MEETING`);
    lines.push(`Board of Directors`);
    lines.push(``);
    lines.push(`Session #${session.number} - ${session.type}`);
    lines.push(`${session.date}`);
    lines.push(``);
    lines.push(`## 1. MEETING DETAILS`);
    lines.push(``);
    lines.push(`- Date and Time: ${session.date}, ${session.time} to ${session.endTime}`);
    lines.push(`- Location: ${session.location} (${session.modality})`);
    lines.push(`- Quorum: ${session.quorum} (${presentCount} of ${attendees.length} members present)`);
    lines.push(`- Meeting Duration: ${totalDuration} minutes`);
    lines.push(``);
    lines.push(`## 2. ATTENDANCE`);
    lines.push(``);
    lines.push(
      `- Present: ${attendees.filter(a=>a.status==='Present')
        .map(a=>`${a.name} (${a.position})`).join('; ')}`
    );
    lines.push(
      `- Absent : ${attendees.filter(a=>a.status==='Absent')
        .map(a=>`${a.name} (${a.position})`).join('; ')}`
    );
    lines.push(``);
    lines.push(`## 3. AGENDA AND DISCUSSIONS`);
    lines.push(``);
    agenda.forEach((item, idx) => {
      lines.push(`### 3.${idx+1}. ${item.title}`);
      lines.push(`Presenter: ${item.presenter} • Duration: ${item.actualDuration} minutes`);
      lines.push(``);
      lines.push(`Discussion:`);
      lines.push(`${item.notes}`);
      lines.push(``);
      if (item.voting.result !== 'No Vote Required') {
        lines.push(`Voting Results:`);
        lines.push(`In Favor: ${item.voting.inFavor}, Against: ${item.voting.against}, Abstain: ${item.voting.abstain}`);
        lines.push(`Decision: ${item.voting.result}`);
        lines.push(``);
      }
      if (item.tasks.length) {
        lines.push(`Action Items:`);
        item.tasks.forEach(t => {
          lines.push(`- ${t.description} - Assigned to: ${t.assignee}, Due: ${t.dueDate}`);
        });
        lines.push(``);
      }
    });
    lines.push(`## 4. NEXT MEETING`);
    lines.push(``);
    lines.push(`The next meeting is scheduled for May 31, 2025 at 10:00 AM.`);
    lines.push(``);
    lines.push(`Minutes Prepared By:`);
    lines.push(`Robert Johnson, Secretary`);
    lines.push(`Date: ${new Date().toLocaleDateString()}`);
    lines.push(``);
    lines.push(`Approved By:`);
    lines.push(`John Doe, Chairperson`);
    lines.push(`Date: ____________________`);
    return lines.join('\n');
  }
}
