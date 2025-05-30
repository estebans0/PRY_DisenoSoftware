import { Component }       from '@angular/core';
import { CommonModule }    from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { LucideAngularModule }   from 'lucide-angular';

@Component({
  standalone: true,
  selector: 'app-header',
  imports: [
    CommonModule,
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
    // show public header only on '/', '/login', '/register'
    router.events.subscribe(evt => {
      if (evt instanceof NavigationEnd) {
        const pub = ['/', '/login', '/register'];
        this.showAuthHeader = pub.includes(evt.urlAfterRedirects);
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
}
