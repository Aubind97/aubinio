import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-basic',
  templateUrl: './basic.component.html',
  styleUrls: ['./basic.component.sass'],
})
export class BasicLayoutComponent {
  user$ = this.authService.user$;

  version = environment.version;
  currentYear = new Date().getFullYear();

  constructor(private authService: AuthService, private router: Router) {}

  loggout() {
    this.authService.signOut().then(() => {
      this.router.navigate(['/login']);
    });
  }
}
