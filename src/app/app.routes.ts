import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { guestGuard, authGuard, rolGuard } from './guard/auth-guard';

export const routes: Routes = [
  { path: '', component: Home },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./components/login/login').then((m) => m.Login),
  },
  {
    path: 'registro',
    canActivate: [guestGuard],
    loadComponent: () => import('./components/registro/registro').then((m) => m.Registro),
  },
  {
    path: 'perfil',
    canActivate: [authGuard],
    loadComponent: () => import('./components/perfil/perfil').then((m) => m.Perfil),
  },
  {
    path: 'candy-bar',
    loadComponent: () => import('./components/candy-bar/candy-bar').then((m) => m.CandyBar),
  },
  {
    path: 'resumen-compra',
    loadComponent: () =>
      import('./components/resumen-compra/resumen-compra').then((m) => m.ResumenCompra),
  },
  {
    path: 'comprobante/:qr',
    loadComponent: () => import('./components/comprobante/comprobante').then((m) => m.Comprobante),
  },
  {
    path: 'peliculas/:id',
    loadComponent: () =>
      import('./components/pelicula-detalle/pelicula-detalle').then((m) => m.PeliculaDetalle),
  },
  {
    path: 'funcion/:id',
    loadComponent: () =>
      import('./components/funcion-butacas/funcion-butacas').then((m) => m.FuncionButacas),
  },
  {
    path: 'acceso-personal',
    loadComponent: () =>
      import('./components/acceso-personal/acceso-personal').then((m) => m.AccesoPersonal),
  },
  {
    path: 'empleado',
    canMatch: [rolGuard('empleado')],
    loadComponent: () => import('./components/empleado/empleado').then((m) => m.Empleado),
  },
  {
    path: 'admin',
    canMatch: [rolGuard('administrador')],
    loadComponent: () => import('./components/admin/admin').then((m) => m.Admin),
  },
  { path: '**', redirectTo: '' },
];
