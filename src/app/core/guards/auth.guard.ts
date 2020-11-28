import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { first, map, tap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): Observable<boolean> {
    return this.authService.user$.pipe(
      first(),
      map((user) => !!user),
      tap((loggedIn) => {
        if (!loggedIn) {
          console.log('🛑 You must be logged in');
          this.router.navigate(['/login']);
        }
      })
    );
  }
}
