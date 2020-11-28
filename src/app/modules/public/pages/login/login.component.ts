import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.sass'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  constructor(private authService: AuthService, private router: Router) {}

  signInWithGoogle() {
    this.authService
      .googleSignin()
      .then(() => {
        this.router.navigate(['/']);
      })
      .catch(() => {
        console.log('⚠️ Connection fail');
      });
  }
}
