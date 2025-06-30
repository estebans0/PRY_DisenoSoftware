// src/app/components/header/header.component.ts
import { Component }                from '@angular/core';
import { CommonModule }             from '@angular/common';
import { Router, NavigationEnd }    from '@angular/router';
import { LucideAngularModule }      from 'lucide-angular';
import { RouterModule }             from '@angular/router';
import { AuthService }              from '../../services/auth.service';

@Component({
  standalone: true,
  selector: 'app-header',
  imports: [
    CommonModule,
    RouterModule,
    LucideAngularModule
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  showAuthHeader = true;
  dark = false;
  profileMenu = false;

  constructor(private router: Router, private authService: AuthService) {
    // public header only on '/', '/login', '/register'
    this.router.events.subscribe(evt => {
      if (evt instanceof NavigationEnd) {
        this.showAuthHeader = ['/', '/login', '/register']
          .includes(evt.urlAfterRedirects);
      }
    });
  }

  toggleTheme() {
    this.dark = !this.dark;
    document.documentElement.classList.toggle('dark', this.dark);
  }

  toggleProfileMenu() {
    this.profileMenu = !this.profileMenu;
  }

  /** Navigate to /profile and close menu */
  goToProfile() {
    this.profileMenu = false;
    this.router.navigate(['/profile']);
  }

  /** Navigate to /session-reports and close menu */
  goToSessionReports() {
    this.profileMenu = false;
    this.router.navigate(['/session-reports']);
  }

  goToInbox() {
    this.profileMenu = false;
    this.router.navigate(['/inbox']);
  }

  /** Log out: clear token + redirect to /login */
  logout() {
    this.authService.logout();
    this.profileMenu = false;
  }

  /** Check if current user is administrator */
  get isAdministrator(): boolean {
    const user = this.currentUser;
    return user?.tipoUsuario === 'ADMINISTRADOR';
  }

  /** Check if current user is JD Member */
  get isJDMember(): boolean {
    const user = this.currentUser;
    return user?.tipoUsuario === 'JDMEMBER';
  }

  /** Get current user info */
  get currentUser() {
    return this.authService.getCurrentUser();
  }

  /** Get display name for current user */
  get userName(): string {
    const user = this.currentUser;
    if (user) {
      return `${user.firstName} ${user.lastName}`;
    }
    return 'User';
  }

  /** Get user role for display */
  get userRole(): string {
    const user = this.currentUser;
    if (user) {
      return user.tipoUsuario === 'ADMINISTRADOR' ? 'Administrator' : 'Member';
    }
    return 'Guest';
  }
}
