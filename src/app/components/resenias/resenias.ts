import { Component, OnInit, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AuthService } from '../../services/auth';
import { ReseniasService } from '../../services/reseñas';
import { Resenia, ResumenPuntuacion } from '../../task/task-model';

@Component({
  imports: [DatePipe],
  selector: 'app-resenias',
  styleUrl: './resenias.css',
  templateUrl: './resenias.html',
})
export class Resenias {
  peliculaId = input.required<string>();

  private srv = inject(ReseniasService);
  auth = inject(AuthService);

  estrellas = [1, 2, 3, 4, 5];

  resumen = signal<ResumenPuntuacion>({ promedio: null, cantidad: 0 });
  lista = signal<Resenia[]>([]);
  puede = signal(false);
  yaTiene = signal(false);

  puntuacion = signal(0);
  hover = signal(0);
  comentario = signal('');

  guardando = signal(false);
  mensaje = signal('');
  error = signal('');

  async ngOnInit() {
    await this.auth.lista;
    await this.cargar();
  }

  async cargar() {
    const id = this.peliculaId();
    const usuarioId = this.auth.perfil()?.id;

    try {
      const [resumen, lista] = await Promise.all([this.srv.resumen(id), this.srv.listar(id)]);
      this.resumen.set(resumen);
      this.lista.set(lista);

      if (usuarioId) {
        this.puede.set(await this.srv.puedeResenar(id, usuarioId));
        const mia = lista.find((r) => r.usuario_id === usuarioId);
        this.yaTiene.set(!!mia);
        if (mia) {
          this.puntuacion.set(mia.puntuacion);
          this.comentario.set(mia.comentario ?? '');
        }
      }
    } catch (e: any) {
      this.error.set(e.message);
    }
  }

  textoEstrellas(valor: number): string {
    const n = Math.round(valor);
    return '★'.repeat(n) + '☆'.repeat(5 - n);
  }

  async guardar(evento: Event) {
    evento.preventDefault();
    const usuarioId = this.auth.perfil()?.id;
    if (!usuarioId || this.puntuacion() === 0) return;

    this.guardando.set(true);
    this.error.set('');
    this.mensaje.set('');
    try {
      await this.srv.guardar(this.peliculaId(), usuarioId, this.puntuacion(), this.comentario());
      this.mensaje.set('¡Gracias! Tu reseña quedó guardada.');
      await this.cargar();
    } catch (e: any) {
      this.error.set(
        e.message?.includes('row-level security')
          ? 'Solo podés calificar películas que ya viste (con entrada validada).'
          : e.message,
      );
    } finally {
      this.guardando.set(false);
    }
  }

  async eliminar() {
    const usuarioId = this.auth.perfil()?.id;
    if (!usuarioId || !confirm('¿Eliminar tu reseña?')) return;
    try {
      await this.srv.eliminar(this.peliculaId(), usuarioId);
      this.puntuacion.set(0);
      this.comentario.set('');
      this.yaTiene.set(false);
      this.mensaje.set('Reseña eliminada.');
      await this.cargar();
    } catch (e: any) {
      this.error.set(e.message);
    }
  }
}
