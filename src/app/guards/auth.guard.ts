import { inject } from '@angular/core';
import { type CanActivateFn, Router } from '@angular/router';
import { tap } from 'rxjs';
import { AuthService } from 'shared/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.isAuthenticated$.pipe(
    tap((isAuth) => {
      if (!isAuth) {
        router.navigate(['/login'], { replaceUrl: true });
      }
    }),
  );
};
