import {
  Component,
  OnInit,
  OnDestroy
} from '@angular/core';
import { CommonModule }                  from '@angular/common';
import { FormsModule }                   from '@angular/forms';
import {
  ActivatedRoute,
  RouterModule,
  Router
} from '@angular/router';
import { LucideAngularModule }           from 'lucide-angular';

interface Attendee {
  id: number;
  name: string;
  position: string;
  status: 'Present' | 'Absent';
}

interface AgendaItem {
  id: number;
  title: string;
  presenter: string;
  duration: number;     // in minutes
  documents: string[];
  notes: string;
  voting: {
    inFavor: number;
    against: number;
    abstain: number;
    result: string;
  };
  tasks: Array<{ description: string; assignee: string }>;
}

@Component({
  selector: 'app-session-start',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    LucideAngularModule
  ],
  templateUrl: './session-start.component.html',
  styleUrls: ['./session-start.component.scss']
})
export class SessionStartComponent implements OnInit, OnDestroy {
  sessionId!: number;

  // Session state
  sessionStarted = false;
  sessionEnded   = false;
  currentTime    = new Date();
  startTime: Date | null = null;
  endTime:   Date | null = null;

  // Timers & UI helpers
  activeItem: number | null = null;
  itemTimers: Record<number, { elapsed: number; running: boolean }> = {};
  openItems:  Record<number, boolean> = {};

  // task form inputs per-item
  newTaskDesc:     Record<number,string> = {};
  newTaskAssignee: Record<number,string> = {};

  // Mock session metadata
  session = {
    number:   '001',
    type:     'Ordinary',
    date:     '2025-05-15',
    time:     '10:00 AM',
    location: 'Board Room A, Main Building'
  };

  // Mock attendees
  attendees: Attendee[] = [
    { id:1, name:'John Doe',       position:'Chairperson',      status:'Present' },
    { id:2, name:'Jane Smith',     position:'Vice Chairperson', status:'Present' },
    { id:3, name:'Robert Johnson', position:'Secretary',        status:'Present' },
    { id:4, name:'Emily Davis',    position:'Treasurer',        status:'Present' },
    { id:5, name:'Michael Wilson', position:'Board Member',     status:'Absent'  },
    { id:6, name:'Sarah Thompson', position:'Board Member',     status:'Present' },
    { id:7, name:'David Martinez', position:'Board Member',     status:'Present' },
    { id:8, name:'Jennifer Garcia',position:'Board Member',     status:'Absent'  },
  ];

  // Mock agenda
  agenda: AgendaItem[] = [
    {
      id:1,
      title: 'Approval of Previous Minutes',
      presenter:'John Doe',
      duration:10,
      documents:['previous_minutes.pdf'],
      notes:'',
      voting:{ inFavor:0, against:0, abstain:0, result:'' },
      tasks:[]
    },
    {
      id:2,
      title:'Financial Report Q1 2025',
      presenter:'Emily Davis',
      duration:20,
      documents:['financial_report_q1_2025.pdf','budget_comparison.xlsx'],
      notes:'',
      voting:{ inFavor:0, against:0, abstain:0, result:'' },
      tasks:[]
    },
    {
      id:3,
      title:'Strategic Plan Update',
      presenter:'Jane Smith',
      duration:30,
      documents:['strategic_plan_update.pptx'],
      notes:'',
      voting:{ inFavor:0, against:0, abstain:0, result:'' },
      tasks:[]
    },
    {
      id:4,
      title:'New Project Proposals',
      presenter:'David Martinez',
      duration:20,
      documents:['project_proposals.pdf'],
      notes:'',
      voting:{ inFavor:0, against:0, abstain:0, result:'' },
      tasks:[]
    },
    {
      id:5,
      title:'Any Other Business',
      presenter:'John Doe',
      duration:10,
      documents:[],
      notes:'',
      voting:{ inFavor:0, against:0, abstain:0, result:'' },
      tasks:[]
    },
  ];

  private intervalId!: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // grab sessionId
    this.sessionId = +this.route.snapshot.paramMap.get('id')!;

    // init timers + open flags + new-task inputs
    for (const item of this.agenda) {
      this.itemTimers[item.id] = { elapsed: 0, running: false };
      this.openItems[item.id]  = false;
      this.newTaskDesc[item.id]     = '';
      this.newTaskAssignee[item.id] = '';
    }

    // tick clock every second
    this.intervalId = window.setInterval(() => {
      this.currentTime = new Date();
      if (
        this.activeItem !== null &&
        this.itemTimers[this.activeItem].running
      ) {
        this.itemTimers[this.activeItem].elapsed++;
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
  }

  // session controls
  startSession(): void {
    this.sessionStarted = true;
    this.startTime      = new Date();
  }

  endSession(): void {
    this.sessionEnded = true;
    this.endTime      = new Date();
    Object.values(this.itemTimers).forEach(t => t.running = false);
    this.activeItem = null;
  }

  // agenda controls
  startAgendaItem(itemId: number): void {
    if (this.activeItem !== null && this.activeItem !== itemId) {
      this.itemTimers[this.activeItem].running = false;
    }
    this.activeItem = itemId;
    this.itemTimers[itemId].running = true;
    this.openItems[itemId] = true;
  }

  pauseAgendaItem(itemId: number): void {
    this.itemTimers[itemId].running = false;
  }

  toggleOpen(itemId: number): void {
    this.openItems[itemId] = !this.openItems[itemId];
  }

  addTask(itemId: number): void {
    const item = this.agenda.find(i => i.id === itemId);
    if (!item) return;
    item.tasks.push({
      description: this.newTaskDesc[itemId],
      assignee:    this.newTaskAssignee[itemId]
    });
    this.newTaskDesc[itemId]     = '';
    this.newTaskAssignee[itemId] = '';
  }

  // computed getters
  get activeAgendaItem(): AgendaItem | undefined {
    return this.activeItem == null
      ? undefined
      : this.agenda.find(i => i.id === this.activeItem);
  }

  get presentCount(): number {
    return this.attendees.filter(a => a.status === 'Present').length;
  }

  get quorumAchieved(): boolean {
    return this.presentCount >= Math.ceil(this.attendees.length / 2);
  }

  // pulled Math.floor logic out of template
  getSessionElapsed(): string {
    if (!this.startTime) return '0:00';
    const secs = Math.floor(
      (new Date().getTime() - this.startTime.getTime()) / 1000
    );
    return this.formatTime(secs);
  }

  getTotalDuration(): string {
    if (!this.startTime || !this.endTime) return '0:00';
    const secs = Math.floor(
      (this.endTime.getTime() - this.startTime.getTime()) / 1000
    );
    return this.formatTime(secs);
  }

  formatTime(totalSeconds: number): string {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2,'0')}`;
  }

  generateMinutes(): void {
    this.router.navigate(['/sessions', this.sessionId, 'minutes']);
  }
}
