import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PeliculasService } from '../../services/peliculas';
import { Funcion, PeliculaConFunciones } from '../../task/task-model';
import { DuracionPipe } from '../../pipes/duracion-pipe';
import { EdadPipe } from '../../pipes/edad-pipe';
import { PrecioPipe } from '../../pipes/precio-pipe';
import { RestrictEdadDirective } from '../../directives/restrict-edad.directive';

const ZONA = 'America/Argentina/Buenos_Aires';

@Component({
  selector: 'app-pelicula-detalle',
  imports: [RouterLink, DuracionPipe, EdadPipe, PrecioPipe, RestrictEdadDirective],
  templateUrl: './pelicula-detalle.html',
  styleUrl: './pelicula-detalle.css',
})
export class PeliculaDetalle implements OnInit {
  private peliculas = inject(PeliculasService);
  private route = inject(ActivatedRoute);

  pelicula = signal<PeliculaConFunciones | null>(null);
  cargando = signal(true);
  error = signal<string | null>(null);

  private formatoClave = new Intl.DateTimeFormat('en-CA', { timeZone: ZONA }); // AAAA-MM-DD
  private formatoDia = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: ZONA,
  });
  private formatoHora = new Intl.DateTimeFormat('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: ZONA,
  });

  // Agrupa las funciones por día: [{ etiqueta: 'jueves, 8 de octubre', funciones: [...] }, ...]
  dias = computed(() => {
    const grupos = new Map<string, { etiqueta: string; funciones: Funcion[] }>();
    for (const f of this.pelicula()?.funciones ?? []) {
      const fecha = new Date(f.inicio);
      const clave = this.formatoClave.format(fecha);
      if (!grupos.has(clave)) {
        grupos.set(clave, { etiqueta: this.formatoDia.format(fecha), funciones: [] });
      }
      grupos.get(clave)!.funciones.push(f);
    }
    return [...grupos.values()];
  });

  hora(iso: string): string {
    return this.formatoHora.format(new Date(iso));
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.cargando.set(false);
      return;
    }
    try {
      this.pelicula.set(await this.peliculas.obtenerPelicula(id));
    } catch (e: any) {
      this.error.set(e.message);
    } finally {
      this.cargando.set(false);
    }
  }
}
