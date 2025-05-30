// src/app/app.component.ts
import { Component }       from '@angular/core';
import { RouterModule }    from '@angular/router';

import { HeaderComponent } from './shared/header/header.component';
import { FooterComponent } from './shared/footer/footer.component';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [
    HeaderComponent,
    FooterComponent,
    RouterModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {}
