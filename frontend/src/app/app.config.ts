// src/app/app.config.ts
import {
  ApplicationConfig,
  importProvidersFrom,
  provideZoneChangeDetection
} from '@angular/core';
import { provideRouter } from '@angular/router';

import {
  LucideAngularModule,
  // existing icons …
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
  Edit,
  Play,
  MapPin,
  Video,
  Send,
  Download,
  Printer,
  FileUp,
  Plus,
  Save,
  Trash2,
  XCircle,
  Pause,
  ChevronDown,
  ChevronUp,
  Square,
  Camera,
  Search,
  Circle,
  Inbox,
  // newly added:
  Loader,
  ExternalLink
} from 'lucide-angular';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    importProvidersFrom(
      LucideAngularModule.pick({
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
        Edit,
        Play,
        MapPin,
        Video,
        Send,
        Download,
        Printer,
        FileUp,
        Plus,
        Save,
        Trash2,
        XCircle,
        Pause,
        ChevronDown,
        ChevronUp,
        Square,
        Camera,
        Search,
        Circle,
        Inbox,
        // newly added:
        Loader,
        ExternalLink
      })
    )
  ]
};
