import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-acceso-personal',
  imports: [ReactiveFormsModule],
  templateUrl: './acceso-personal.html',
  styleUrl: './acceso-personal.css',
})
export class AccesoPersonal {
  private auth = inject(AuthService);
  private router = inject(Router);

  error = '';
  enviando = signal(false);
  mostrarPassword = signal(false);

  formulario = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  async ingresar() {
    this.error = '';

    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.enviando.set(true);

    const { email, password } = this.formulario.getRawValue();

    try {
      await this.auth.login(email, password);

      const rol = this.auth.rol();

      if (rol === 'empleado') {
        await this.router.navigateByUrl('/empleado');
        return;
      }

      if (rol === 'administrador') {
        await this.router.navigateByUrl('/admin');
        return;
      }

      await this.auth.cerrarSesionSinRedirigir();

      this.error = 'Esta cuenta no tiene permisos para acceder al área de personal.';
    } catch (error) {
      this.error = error instanceof Error ? error.message : 'No se pudo iniciar sesión.';
    } finally {
      this.enviando.set(false);
    }
  }
}
