import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { guestGuard } from './guard/auth-guard';

export const routes: Routes = [
    { path: '', component: Home },
    {
        path: 'login',
        canActivate: [guestGuard],
        loadComponent: () => import('./components/login/login').then(m => m.Login)
    },
    {
        path: 'registro',
        canActivate: [guestGuard],
        loadComponent: () => import('./components/registro/registro').then(m => m.Registro)
    },
    {
        path: 'candy-bar',
        loadComponent: () => import('./components/candy-bar/candy-bar').then(m => m.CandyBar)
    },
    { path: '**', redirectTo: '' }
];