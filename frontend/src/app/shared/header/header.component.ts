// src/app/components/header/header.component.ts
import { Component }                from '@angular/core';
import { CommonModule }             from '@angular/common';
import { Router, NavigationEnd }    from '@angular/router';
import { LucideAngularModule }      from 'lucide-angular';
import { RouterModule }             from '@angular/router';

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

  constructor(private router: Router) {
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

  /** Log out: clear token + redirect to /login */
  logout() {
    // clear any auth storage (e.g. JWT)
    localStorage.removeItem('token');
    this.profileMenu = false;
    this.router.navigate(['/login']);
  }
}
