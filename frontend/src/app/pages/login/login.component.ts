// src/app/pages/login/login.component.ts
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
  selector: 'app-login',
  imports: [
    CommonModule,
    FormsModule,           // for ngModel
    RouterModule,          // for routerLink
    LucideAngularModule,   // for the eye/eye-off toggle icons
    HttpClientModule,      // for AuthService
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  form = { email: '', password: '' };
  showPassword = false;
  submitted = false;
  errorMessage: string | null = null;

  constructor(private router: Router, private auth: AuthService) {}

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = null;

    if (!this.form.email || !this.form.password) {
      this.errorMessage = 'Email and password are required.';
      return;
    }

    // Call AuthService.login(...)
    this.auth.login({ email: this.form.email, password: this.form.password })
      .subscribe({
        next: (res) => {
          if (res.user.tipoUsuario === 'ADMINISTRADOR') {
          this.router.navigate(['/dashboard']);
          }
          else if (res.user.tipoUsuario === 'JDMEMBER') {
            this.router.navigate(['/session-reports']);
          }
        },
        error: (err) => {
          console.error(err);
          this.errorMessage = err?.error?.message || 'Invalid credentials.';
        }
      });
  }
}
