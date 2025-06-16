// src/app/pages/settings/settings.component.ts
import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { FormsModule }       from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

import { SettingsService, Settings } from '../../services/settings.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './settings.component.html',
})
export class SettingsComponent implements OnInit {
  @ViewChild('loadingTpl', { static: true }) loadingTpl!: TemplateRef<any>;

  settings!: Settings;
  loading = true;
  error: string | null = null;
  justSaved = false;

  currentTab: 'session'|'notifications'|'templates' = 'session';

  sessionKeys: Array<keyof Settings['sessionSettings']> = [
    'autoSendReminders',
    'requireAttendanceConfirmation',
    'allowVirtualAttendance',
    'recordSessions',
    'autoGenerateMinutes'
  ];
  notificationKeys: Array<keyof Settings['notifications']> = [
    'sessionCreated',
    'sessionReminder',
    'minutesAvailable',
    'taskAssigned'
  ];

  constructor(private svc: SettingsService) {}

  ngOnInit() {
    this.svc.get().subscribe({
      next: s => { this.settings = s; this.loading = false; },
      error: err => { console.error(err); this.error = 'Failed to load settings'; }
    });
  }

  selectTab(tab: 'session'|'notifications'|'templates') {
    this.currentTab = tab;
  }

  save() {
    this.svc.update(this.settings).subscribe({
      next: () => {
        this.justSaved = true;
      },
      error: err => {
        console.error(err);
        alert('Save failed');
      }
    });
  }

  closeSavedDialog() {
    this.justSaved = false;
  }
}
