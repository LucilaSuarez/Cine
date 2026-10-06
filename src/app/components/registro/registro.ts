import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { fechaNacimientoValida, passwordsIguales } from '../../validators/registro.validators';

@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './registro.html',
  styleUrl: './registro.css'
})
export class Registro {
  private fb = inject(NonNullableFormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  enviando = signal(false);
  errorServidor = signal<string | null>(null);
  confirmarEmail = signal(false);
  mostrarPassword = signal(false);

  readonly tiposSangre = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  readonly coloresOjos = ['Marrón', 'Negro', 'Azul', 'Verde', 'Gris', 'Avellana'];
  readonly hoy = new Date().toISOString().slice(0, 10);   // tope del selector de fecha

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmar: ['', Validators.required],
    nombre: ['', Validators.required],
    apellido: ['', Validators.required],
    fecha_nacimiento: ['', [Validators.required, fechaNacimientoValida]],
    tipo_sangre: ['', Validators.required],
    color_ojos: ['', Validators.required],
    dias_vacaciones: [
      null as number | null,
      [Validators.required, Validators.min(0), Validators.max(365), Validators.pattern(/^\d+$/)]
    ]
  }, { validators: passwordsIguales });

  invalido(campo: string): boolean {
    const c = this.form.get(campo);
    return !!c && c.invalid && c.touched;
  }

  // Un solo lugar para los mensajes de error de todos los campos
  mensaje(campo: string): string | null {
    const c = this.form.get(campo);
    if (!c || !c.touched || !c.errors) return null;
    if (c.hasError('required')) return 'Este campo es obligatorio.';
    if (c.hasError('email')) return 'El email no tiene un formato válido.';
    if (c.hasError('minlength')) return 'Debe tener al menos 6 caracteres.';
    if (c.hasError('fechaFutura')) return 'La fecha no puede ser futura.';
    if (c.hasError('fechaMuyAntigua')) return 'Ingresá una fecha válida.';
    if (c.hasError('min') || c.hasError('max') || c.hasError('pattern')) {
      return 'Ingresá un número entero entre 0 y 365.';
    }
    return null;
  }

  async enviar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.errorServidor.set(null);

    try {
      const v = this.form.getRawValue();
      const conSesion = await this.auth.registrar({
        email: v.email.trim(),
        password: v.password,
        nombre: v.nombre.trim(),
        apellido: v.apellido.trim(),
        fecha_nacimiento: v.fecha_nacimiento,
        tipo_sangre: v.tipo_sangre,
        color_ojos: v.color_ojos,
        dias_vacaciones: v.dias_vacaciones!
      });

      if (conSesion) {
        this.router.navigateByUrl('/');
      } else {
        this.confirmarEmail.set(true);   // hay que confirmar el email antes de entrar
        this.form.reset();
      }
    } catch (e: any) {
      this.errorServidor.set(e.message);
    } finally {
      this.enviando.set(false);
    }
  }
}