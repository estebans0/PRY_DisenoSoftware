// src/app/pages/sessions/[id]/session-start/session-start.component.ts

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
import { SessionService }                from '../../../../services/session.service';
import { AgendaItemFactory }             from '../../../../models/agenda-item.model';

interface Attendee {
  email: string;  // Use email as the primary identifier
  name: string;
  position: string;
  status: 'Present' | 'Absent';
}

interface AgendaItem {
  id: number;
  title: string;
  presenter: string;
  duration: number;     // in minutes
  tipoPunto: string;
  documents: string[];
  notes: string;
  responsible?: {       // Add responsible field
    name: string;
    email: string;
  };
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
  sessionId!: string;
  session!: any;
  attendees: Attendee[] = [];
  agenda: AgendaItem[]  = [];

  sessionStarted = false;
  sessionEnded   = false;
  currentTime    = new Date();
  startTime: Date | null = null;
  endTime:   Date | null = null;

  activeItem: number | null = null;
  itemTimers: Record<number, { elapsed: number; running: boolean }> = {};
  openItems:  Record<number, boolean> = {};

  newTaskDesc:     Record<number,string> = {};
  newTaskAssignee: Record<number,string> = {};

  /**
   * Track responsible person selections for each agenda item
   */
  responsibleSelections: Record<number, string> = {}; // email string

  /**
   * For each agenda item, track which attendee IDs are checked
   * in each voting category, plus the computed result.
   */
  voteSelections: Record<number, {
    inFavor: string[];  // These are now email strings
    against: string[];  // These are now email strings
    abstain: string[];  // These are now email strings
    result?: string;
  }> = {};

  private intervalId!: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sessionService: SessionService
  ) {}

  ngOnInit(): void {
    this.sessionId = this.route.snapshot.paramMap.get('id')!;

    this.sessionService.getSession(this.sessionId).subscribe({
      next: sess => {
        this.session        = sess;
        this.sessionStarted = sess.status === 'In Progress' || sess.status === 'Completed';
        this.sessionEnded   = sess.status === 'Completed';

        if (sess.startTime) this.startTime = new Date(sess.startTime);
        if (sess.endTime)   this.endTime   = new Date(sess.endTime);

        // Update to use email as the identifier
        this.attendees = (sess.attendees || []).map((a: any) => ({
          email: a.email || '',  // Use email as the unique ID
          name: a.name,
          position: a.role || 'Member',
          status: 'Present'
        }));

        // Process agenda items
        this.agenda = (sess.agenda || []).map((ai: any) => {
          // Create the item as before
          const item = {
            id: ai.order,
            title: ai.title,
            presenter: ai.presenter,
            duration: ai.duration,
            tipoPunto: ai.tipoPunto || 'informativa',
            description: ai.description || '',
            documents: (ai.documents || []).map((d: any) => d.fileName),
            notes: ai.notes || '',
            responsible: ai.responsible || null, // Add responsible field
            tasks: (ai.actions || []).map((t: any) => ({
              description: t.description,
              assignee: t.assignee?.name || ''
            })),
            voting: {
              inFavor: (ai.pro || []).length,
              against: (ai.against || []).length,
              abstain: (ai.abstained || []).length,
              result: ai.decision || ''
            }
          };

          // Initialize tracking objects
          this.itemTimers[item.id] = { elapsed: 0, running: false };
          this.openItems[item.id] = false;
          this.newTaskDesc[item.id] = '';
          this.newTaskAssignee[item.id] = '';
          
          // Initialize responsible person selection
          this.responsibleSelections[item.id] = ai.responsible?.email || '';

          // Initialize vote selections
          this.voteSelections[item.id] = {
            inFavor: [],
            against: [],
            abstain: [],
            result: ai.decision || ''
          };

          // Fill voting selections from the agenda data
          if (ai.pro && ai.pro.length) {
            this.voteSelections[item.id].inFavor = ai.pro
              .map((p: any) => p.email || '')
              .filter(Boolean);
          }

          if (ai.against && ai.against.length) {
            this.voteSelections[item.id].against = ai.against
              .map((p: any) => p.email || '')
              .filter(Boolean);
          }

          if (ai.abstained && ai.abstained.length) {
            this.voteSelections[item.id].abstain = ai.abstained
              .map((p: any) => p.email || '')
              .filter(Boolean);
          }

          return item;
        });

        console.log('Agenda items loaded:', this.agenda);
        console.log('Vote selections initialized:', this.voteSelections);
      },
      error: err => console.error('Failed to load session for start', err)
    });

    this.intervalId = window.setInterval(() => {
      this.currentTime = new Date();
      if (this.activeItem !== null && this.itemTimers[this.activeItem].running) {
        this.itemTimers[this.activeItem].elapsed++;
      }
    }, 1000);
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalId);
  }

  // — Session lifecycle —

  startSession(): void {
    if (!this.quorumAchieved) {
      alert(`Cannot start session if quorum isn't achieved`);
      return;
    }

    this.sessionService.startSession(this.sessionId).subscribe({
      next: sess => {
        this.sessionStarted = true;
        this.session.status  = 'In Progress';
        if (sess.startTime) this.startTime = new Date(sess.startTime);
      },
      error: err => console.error('Error starting session', err)
    });
  }

  endSession(): void {
    this.sessionService.endSession(this.sessionId).subscribe({
      next: sess => {
        this.sessionEnded  = true;
        this.session.status = 'Completed';
        if (sess.endTime) this.endTime = new Date(sess.endTime);
        Object.values(this.itemTimers).forEach(t => t.running = false);
        this.activeItem = null;
      },
      error: err => console.error('Error ending session', err)
    });
  }

  // — Agenda controls —

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

  saveNotes(itemId: number): void {
    this.persistItem(itemId);
  }

  addTask(itemId: number): void {
    const it = this.agenda.find(a => a.id === itemId);
    if (!it) return;
    it.tasks.push({
      description: this.newTaskDesc[itemId],
      assignee:    this.newTaskAssignee[itemId]
    });
    this.newTaskDesc[itemId]     = '';
    this.newTaskAssignee[itemId] = '';
    this.persistItem(itemId);
  }

  assignResponsible(itemId: number): void {
    const selectedEmail = this.responsibleSelections[itemId];
    const item = this.agenda.find(a => a.id === itemId);
    
    if (!item || !selectedEmail) return;
    
    // Find the attendee by email
    const attendee = this.attendees.find(a => a.email === selectedEmail);
    if (!attendee) return;
    
    // Assign the responsible person
    item.responsible = {
      name: attendee.name,
      email: attendee.email
    };
    
    // Save the changes
    this.persistItem(itemId);
  }

  private persistItem(itemId: number): void {
    const payload = this.buildFullAgendaPayload();
    this.sessionService.updateAgenda(this.sessionId, payload).subscribe({
      next: () => console.log(`Saved item #${itemId}`),
      error: e => console.error('Failed to save item', e)
    });
  }

  private buildVoterList(count: number) {
    return this.attendees
      .filter(a => a.status === 'Present')
      .slice(0, count)
      .map(a => ({
        name:   a.name,
        email:  '',
        status: 'Confirmed',
        role:   a.position
      }));
  }

  // — Voting UI logic —

  toggleVote(
    itemId: number,
    category: 'inFavor' | 'against' | 'abstain',
    email: string,  // Changed from attendeeId: number
    checked: boolean
  ): void {
    // Ensure voteSelections entry exists
    if (!this.voteSelections[itemId]) {
      this.voteSelections[itemId] = {
        inFavor: [],
        against: [],
        abstain: []
      };
    }
    
    if (checked) {
      // Add to selection if not already there
      if (!this.voteSelections[itemId][category].includes(email)) {
        this.voteSelections[itemId][category].push(email);
      }
    } else {
      // Remove from selection
      this.voteSelections[itemId][category] = 
        this.voteSelections[itemId][category].filter(e => e !== email);
    }
  }

  registerVotes(itemId: number): void {
    const vs = this.voteSelections[itemId];
    const it = this.agenda.find(a => a.id === itemId)!;

    const fav   = vs.inFavor.length;
    const ag    = vs.against.length;
    const abst  = vs.abstain.length;

    it.voting.inFavor  = fav;
    it.voting.against  = ag;
    it.voting.abstain  = abst;

    // 1) If In Favor and Against are tied ⇒ Deferred  
    // 2) Else if Abstain strictly > both others ⇒ Deferred  
    // 3) Else if In Favor strictly > both others ⇒ Approved  
    // 4) Else if Against strictly > both others ⇒ Rejected  
    // 5) Otherwise (any leftover edge) ⇒ Deferred
    if (fav === ag) {
      vs.result = 'Deferred';
    }
    else if (abst > fav && abst > ag) {
      vs.result = 'Deferred';
    }
    else if (fav > ag && fav > abst) {
      vs.result = 'Approved';
    }
    else if (ag > fav && ag > abst) {
      vs.result = 'Rejected';
    }
    else {
      vs.result = 'Deferred';
    }

    it.voting.result = vs.result!;
    this.persistItem(itemId);
  }

  // — Computed helpers —

  get presentCount(): number {
    return this.attendees.filter(a => a.status === 'Present').length;
  }

  get quorumAchieved(): boolean {
    return this.presentCount >= Math.ceil(this.attendees.length / 2);
  }

  get presentAttendees(): Attendee[] {
    return this.attendees.filter(att => att.status === 'Present');
  }

  getSessionElapsed(): string {
    if (!this.startTime) return '0:00';
    const secs = Math.floor((Date.now() - this.startTime.getTime()) / 1000);
    return this.formatTime(secs);
  }

  getTotalDuration(): string {
    if (!this.startTime || !this.endTime) return '0:00';
    const secs = Math.floor((this.endTime.getTime() - this.startTime.getTime()) / 1000);
    return this.formatTime(secs);
  }

  /** MUST be public for template binding */
  public formatTime(totalSeconds: number): string {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  /** Build the same “agenda payload” you use in persistItem() */
  private buildFullAgendaPayload() {
    return this.agenda.map(ai => ({
      order:         ai.id,
      title:         ai.title,
      duration:      ai.duration,
      presenter:     ai.presenter,
      tipoPunto:     ai.tipoPunto,
      estimatedTime: ai.duration,
      pro:           this.buildVoterList(ai.voting.inFavor),
      against:       this.buildVoterList(ai.voting.against),
      abstained:     this.buildVoterList(ai.voting.abstain),
      actions:       ai.tasks.map(t => ({
                        description: t.description,
                        assignee:    { _id: '', name: t.assignee }
                      })),
      documents:     [] as any[],
      decision:      ai.voting.result || null,
      notes:         ai.notes,
      responsible:   ai.responsible || null
    }));
  }

  generateMinutes(): void {
    const payload = this.buildFullAgendaPayload();
    this.sessionService
      .updateAgenda(this.sessionId, payload)
      .subscribe({
        next: () => {
          // only once the server has acknowledged our final save…
          this.router.navigate(['/sessions', this.sessionId, 'minutes']);
        },
        error: err => {
          console.error('Failed to persist before generating minutes', err);
          alert('Sorry, could not save your changes. Please try again.');
        }
      });
  }

  /** Shortcut to return the active agenda item */
  get activeAgendaItem(): AgendaItem | undefined {
    return this.activeItem == null
      ? undefined
      : this.agenda.find(i => i.id === this.activeItem);
  }

  showVotingSection(item: any): boolean {
    return item && item.tipoPunto === 'Aprobaciones';
  }

}