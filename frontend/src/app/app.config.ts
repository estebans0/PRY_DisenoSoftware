// src/app/app.config.ts
import { ApplicationConfig, importProvidersFrom, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import {
  LucideAngularModule,
  // existing
  ClipboardList,
  ArrowRight,
  Eye,
  EyeOff,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  FileText,
  AlertCircle,
  Home,
  Settings,
  Sun,
  Moon,
  User,
  UserPlus,
  // session-detail / dashboard / common
  Edit,
  Play,
  MapPin,
  Video,
  Send,
  Download,
  // session-minutes
  Printer,
  // session-edit / new session
  FileUp,
  Plus,
  Save,
  Trash2,
  XCircle,
  // session-start
  Pause,
  ChevronDown,
  ChevronUp,
  Square,
  // profile
  Camera,
} from 'lucide-angular';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    importProvidersFrom(
      LucideAngularModule.pick({
        // base icons
        ClipboardList,
        ArrowRight,
        Eye,
        EyeOff,
        Calendar,
        Clock,
        Users,
        CheckCircle2,
        FileText,
        AlertCircle,
        Home,
        Settings,
        Sun,
        Moon,
        User,
        UserPlus,

        // detail/dashboard/common
        Edit,
        Play,
        MapPin,
        Video,
        Send,
        Download,

        // minutes page
        Printer,

        // edit / new
        FileUp,
        Plus,
        Save,
        Trash2,
        XCircle,

        // start/execution
        Pause,
        ChevronDown,
        ChevronUp,
        Square,

        // profile
        Camera
      })
    )
  ]
};
