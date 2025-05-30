import { Component }           from '@angular/core';
import { CommonModule }        from '@angular/common';
import { RouterModule }        from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [
    CommonModule,
    RouterModule,         // for routerLink
    LucideAngularModule,  // for <lucide-icon> in the hero/buttons
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {}
