import { Component }           from '@angular/core';
import { Router }              from '@angular/router';
import { CommonModule }        from '@angular/common';
import { FormsModule }         from '@angular/forms';
import { RouterModule }        from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [
    CommonModule,
    FormsModule,           // for ngModel
    RouterModule,          // for routerLink
    LucideAngularModule,   // for the eye/eye-off toggle icons
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  form = { email: '', password: '' };
  showPassword = false;
  submitted = false;

  constructor(private router: Router) {}

  onSubmit(): void {
    this.submitted = true;
    if (this.form.email && this.form.password) {
      this.router.navigate(['/dashboard']);
    }
  }
}
