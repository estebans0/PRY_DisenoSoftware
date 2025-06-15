import { Component, OnInit }            from '@angular/core';
import { CommonModule }                 from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { LucideAngularModule }          from 'lucide-angular';

@Component({
  selector: 'app-session-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LucideAngularModule,
  ],
  templateUrl: './session-detail.component.html',
  styleUrls: ['./session-detail.component.scss']
})
export class SessionDetailComponent implements OnInit {
  // default to overview so it shows immediately
  activeTab: 'overview' | 'agenda' | 'attendees' | 'documents' = 'overview';

  sessionId!: number;
  session!: {
    id: number;
    number: string;
    type: string;
    date: string;
    time: string;
    status: string;
    quorum: string;
    modality: string;
    location: string;
    description: string;
    createdBy: string;
    createdAt: string;
  };

  attendees: { id:number; name:string; position:string; status:string }[] = [];
  agenda:    { id:number; title:string; presenter:string; duration:number; documents:string[] }[] = [];
  documents: { id:number; name:string; size:string; uploadedBy:string; uploadedAt:string }[] = [];

  confirmedCount = 0;
  pendingCount   = 0;
  declinedCount  = 0;
  totalDuration  = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // load before first render
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam === 'new') {
      window.location.href = '/sessions/new';
      return;
    }
    this.sessionId = Number(idParam);
    this.loadMockData();
  }

  /** navigate to /sessions/:id/edit */
  goToEdit() {
    this.router.navigate(['/sessions', this.sessionId, 'edit']);
  }

  /** navigate to /sessions/:id/start */
  goToStart() {
    this.router.navigate(['/sessions', this.sessionId, 'start']);
  }

  private loadMockData() {
    const id = this.sessionId;
    this.session = {
      id,
      number: id === 1 ? '001' : id === 2 ? '002' : `S-2025-00${id}`,
      type:    id % 2 === 0 ? 'Extraordinary' : 'Ordinary',
      date:    id <= 2     ? '2025-05-15'          : '2025-04-30',
      time:    id % 2 === 0 ? '2:00 PM'            : '10:00 AM',
      status:  id <= 2     ? 'Scheduled'          : 'Completed',
      quorum:  id <= 2     ? 'Pending'            : 'Achieved',
      modality:id % 2 === 0 ? 'Virtual'            : 'In Person',
      location:id % 2 === 0
                ? 'Virtual Meeting (Zoom)'
                : 'Board Room A, Main Building',
      description: 'Regular monthly board meeting to discuss ongoing projects and financial updates.',
      createdBy:   'John Doe',
      createdAt:   '2025-05-01'
    };

    this.attendees = [
      { id: 1, name: 'John Doe',       position: 'Chairperson',      status: 'Confirmed' },
      { id: 2, name: 'Jane Smith',     position: 'Vice Chairperson', status: 'Confirmed' },
      { id: 3, name: 'Robert Johnson', position: 'Secretary',        status: 'Pending'   },
      { id: 4, name: 'Emily Davis',    position: 'Treasurer',        status: 'Confirmed' },
      { id: 5, name: 'Michael Wilson', position: 'Board Member',     status: 'Declined'  },
      { id: 6, name: 'Sarah Thompson', position: 'Board Member',     status: 'Pending'   },
      { id: 7, name: 'David Martinez', position: 'Board Member',     status: 'Confirmed' },
      { id: 8, name: 'Jennifer Garcia',position: 'Board Member',     status: 'Pending'   },
    ];

    this.agenda = [
      { id: 1, title: 'Approval of Previous Minutes', presenter: 'John Doe',      duration: 10, documents: ['previous_minutes.pdf'] },
      { id: 2, title: 'Financial Report Q1 2025',     presenter: 'Emily Davis',    duration: 20, documents: ['financial_report_q1_2025.pdf','budget_comparison.xlsx'] },
      { id: 3, title: 'Strategic Plan Update',        presenter: 'Jane Smith',     duration: 30, documents: ['strategic_plan_update.pptx'] },
      { id: 4, title: 'New Project Proposals',        presenter: 'David Martinez', duration: 20, documents: ['project_proposals.pdf'] },
      { id: 5, title: 'Any Other Business',           presenter: 'John Doe',       duration: 10, documents: [] },
    ];

    this.documents = [
      { id:1, name:'previous_minutes.pdf',       size:'1.2 MB', uploadedBy:'Robert Johnson', uploadedAt:'2025-05-01' },
      { id:2, name:'financial_report_q1_2025.pdf',size:'3.5 MB', uploadedBy:'Emily Davis',    uploadedAt:'2025-05-05' },
      { id:3, name:'budget_comparison.xlsx',     size:'0.8 MB', uploadedBy:'Emily Davis',    uploadedAt:'2025-05-05' },
      { id:4, name:'strategic_plan_update.pptx', size:'5.2 MB', uploadedBy:'Jane Smith',      uploadedAt:'2025-05-08' },
      { id:5, name:'project_proposals.pdf',      size:'2.7 MB', uploadedBy:'David Martinez',  uploadedAt:'2025-05-10' },
    ];

    this.confirmedCount = this.attendees.filter(a => a.status==='Confirmed').length;
    this.pendingCount   = this.attendees.filter(a => a.status==='Pending').length;
    this.declinedCount  = this.attendees.filter(a => a.status==='Declined').length;
    this.totalDuration  = this.agenda.reduce((sum, item) => sum + item.duration, 0);
  }

  isActive(tab: 'overview'|'agenda'|'attendees'|'documents'): boolean {
    return this.activeTab === tab;
  }

  badgeClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'pending':   return 'bg-amber-100 text-amber-800   dark:bg-amber-900   dark:text-amber-100';
      case 'declined':  return 'bg-red-100   text-red-800     dark:bg-red-900     dark:text-red-100';
      default:          return 'bg-gray-100  text-gray-800    dark:bg-gray-800    dark:text-gray-100';
    }
  }
}
