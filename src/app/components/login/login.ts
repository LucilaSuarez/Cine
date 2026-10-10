import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  selector: 'app-login',
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  private fb = inject(NonNullableFormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  enviando = signal(false);
  errorServidor = signal<string | null>(null);
  mostrarPassword = signal(false);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  get email() {
    return this.form.controls.email;
  }
  get password() {
    return this.form.controls.password;
  }

  async enviar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched(); // muestra los errores de todos los campos
      return;
    }

    this.enviando.set(true);
    this.errorServidor.set(null);

    try {
      const { email, password } = this.form.getRawValue();
      await this.auth.login(email.trim(), password);
      const rol = this.auth.rol();

      if (rol === 'administrador') {
        await this.router.navigateByUrl('/admin');
        return;
      }

      if (rol === 'empleado') {
        await this.router.navigateByUrl('/empleado');
        return;
      }

      const destino = this.route.snapshot.queryParamMap.get('returnUrl');
      const seguro = destino && destino.startsWith('/') && !destino.startsWith('//');
      await this.router.navigateByUrl(seguro ? destino : '/');
    } catch (e: any) {
      this.errorServidor.set(e.message);
    } finally {
      this.enviando.set(false);
    }
  }

  async ingresarConProveedor(proveedor: 'google' | 'github') {
    this.enviando.set(true);
    this.errorServidor.set(null);

    try {
        await this.auth.loginConProveedor(proveedor);
    } catch (e: any) {
        this.errorServidor.set(e.message);
        this.enviando.set(false);
    }
  }
}
