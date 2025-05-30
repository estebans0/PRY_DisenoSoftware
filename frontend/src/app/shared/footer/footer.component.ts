import { Component }    from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-footer',
  imports: [
    CommonModule,
    RouterModule,
  ],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent {
  // avoids using `new Date()` in the template
  currentYear = new Date().getFullYear();
}
