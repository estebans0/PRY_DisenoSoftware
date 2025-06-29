// src/app/pages/register/register.component.ts
import { Component }           from '@angular/core';
import { Router }              from '@angular/router';
import { CommonModule }        from '@angular/common';
import { FormsModule }         from '@angular/forms';
import { RouterModule }        from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { HttpClientModule }    from '@angular/common/http';
import { AuthService }         from '../../services/auth.service';

@Component({
  standalone: true,
  selector: 'app-register',
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    LucideAngularModule,
    HttpClientModule,
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
    position: '',
    tipoUsuario: 'JDMEMBER', // Default to 'JDMEMBER'
  };
  showPassword = false;
  showConfirm  = false;
  submitted = false;
  errorMessage: string | null = null;

  constructor(private router: Router, private auth: AuthService) {}

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = null;
    const f = this.form;

    if (!f.firstName || !f.lastName || !f.email) {
      this.errorMessage = 'All fields are required.';
      return;
    }
    if (f.password !== f.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }
    if (f.password.length < 8) {
      this.errorMessage = 'Password must be at least 8 characters.';
      return;
    }

    // Call AuthService.register(...)
    this.auth.register({
      firstName: f.firstName,
      lastName: f.lastName,
      email: f.email,
      password: f.password,
      confirmPassword: f.confirmPassword,
      position: f.position,
      tipoUsuario: f.tipoUsuario
    }).subscribe({
      next: (res) => {
        // On success, token was stored—navigate to session reports
        this.router.navigate(['/session-reports']);
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = err?.error?.message || 'Registration failed.';
      }
    });
  }
}
