// src/app/app.routes.ts
import { Routes } from '@angular/router';

import { HomeComponent }         from './pages/home/home.component';
import { LoginComponent }        from './pages/login/login.component';
import { RegisterComponent }     from './pages/register/register.component';
import { DashboardComponent }    from './pages/dashboard/dashboard.component';
import { SessionNewComponent }   from './pages/sessions/new/session-new.component';
import { SessionEditComponent }  from './pages/sessions/[id]/session-edit/session-edit.component';
import { SessionDetailComponent }from './pages/sessions/[id]/session-detail/session-detail.component';
import { SessionStartComponent } from './pages/sessions/[id]/session-start/session-start.component';
import { SessionMinutesComponent } from './pages/sessions/[id]/session-minutes/session-minutes.component';
import { SessionNotifyComponent } from './pages/sessions/[id]/session-notify/session-notify.component';

export const routes: Routes = [
  { path: '',           component: HomeComponent },
  { path: 'login',      component: LoginComponent },
  { path: 'register',   component: RegisterComponent },
  { path: 'dashboard',  component: DashboardComponent },

  // New session must come *before* :id 
  { path: 'sessions/new',      component: SessionNewComponent },
  { path: 'sessions/:id/edit', component: SessionEditComponent },
  { path: 'sessions/:id/start', component: SessionStartComponent },
  { path: 'sessions/:id/minutes', component: SessionMinutesComponent },
  { path: 'sessions/:id/notify', component: SessionNotifyComponent },

  // Now the generic :id will only catch things like /sessions/1
  { path: 'sessions/:id',      component: SessionDetailComponent },

  { path: '**', redirectTo: '' },
];
