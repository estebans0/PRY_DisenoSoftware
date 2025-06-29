// src/app/app.routes.ts
import { Routes } from '@angular/router';

import { AuthGuard } from './guards/auth.guard';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { MembersComponent } from './pages/members/members.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { RegisterComponent } from './pages/register/register.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { SessionNewComponent } from './pages/sessions/new/session-new.component';
import { SessionListComponent } from './pages/sessions/session-list/session-list.component';
import { SessionEditComponent } from './pages/sessions/[id]/session-edit/session-edit.component';
import { SessionStartComponent } from './pages/sessions/[id]/session-start/session-start.component';
import { SessionNotifyComponent } from './pages/sessions/[id]/session-notify/session-notify.component';
import { SessionDetailComponent } from './pages/sessions/[id]/session-detail/session-detail.component';
import { SessionMinutesComponent } from './pages/sessions/[id]/session-minutes/session-minutes.component';
import { SessionVisitorListComponent } from './pages/sessions/session-view/session-visitor-list.component';

export const routes: Routes = [
  { path: '',         component: HomeComponent },
  { path: 'login',    component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  { path: 'members',  component: MembersComponent,  canActivate: [AuthGuard] },
  { path: 'settings', component: SettingsComponent, canActivate: [AuthGuard] },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'profile',   component: ProfileComponent,   canActivate: [AuthGuard] },
  { path: 'session-reports', component: SessionVisitorListComponent, canActivate: [AuthGuard] }, // Asegurar que solo miembros de junta puedan acceder , data: { roles: ['board_member']
  { path: 'sessions',  component: SessionListComponent, canActivate: [AuthGuard] },

  { path: 'sessions/new',      component: SessionNewComponent, canActivate: [AuthGuard] },
  { path: 'sessions/:id/edit', component: SessionEditComponent, canActivate: [AuthGuard] },
  { path: 'sessions/:id/start',component: SessionStartComponent, canActivate: [AuthGuard] },
  { path: 'sessions/:id',        component: SessionDetailComponent,  canActivate: [AuthGuard] },
  { path: 'sessions/:id/minutes', component: SessionMinutesComponent, canActivate: [AuthGuard] },
  { path: 'sessions/:id/notify',  component: SessionNotifyComponent,  canActivate: [AuthGuard] },

  
  { path: '**', redirectTo: '' },
];
