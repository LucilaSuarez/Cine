import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';
import { RolUsuario } from '../task/task-model';

// Requiere sesión iniciada.
export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.lista;

  return auth.estaLogueado()
    ? true
    : router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};

// Solo para visitantes
export const guestGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.lista;

  return auth.estaLogueado() ? router.createUrlTree(['/']) : true;
};

// Requiere uno de los roles indicados.
export const rolGuard = (...roles: RolUsuario[]): CanMatchFn => {
  return async (_route, segments) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    await auth.lista;

    if (!auth.estaLogueado()) {
      const destino = '/' + segments.map((s) => s.path).join('/');
      return router.createUrlTree(['/login'], { queryParams: { returnUrl: destino } });
    }

    const rol = auth.rol();
    return rol && roles.includes(rol) ? true : router.createUrlTree(['/']);
  };
};
