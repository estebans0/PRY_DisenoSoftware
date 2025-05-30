import { Component }           from '@angular/core';
import { Router }              from '@angular/router';
import { CommonModule }        from '@angular/common';
import { FormsModule }         from '@angular/forms';
import { RouterModule }        from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  standalone: true,
  selector: 'app-register',
  imports: [
    CommonModule,
    FormsModule,           // for ngModel
    RouterModule,          // for routerLink
    LucideAngularModule,   // for the eye/eye-off toggle icons
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  form = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  };
  showPassword = false;
  showConfirm  = false;
  submitted = false;

  constructor(private router: Router) {}

  onSubmit(): void {
    this.submitted = true;
    const f = this.form;
    if (
      f.firstName &&
      f.lastName &&
      f.email &&
      f.password === f.confirmPassword &&
      f.password.length >= 8
    ) {
      this.router.navigate(['/dashboard']);
    }
  }
}
