import { Component, HostListener, computed, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PeliculasService } from '../../services/peliculas';
import { Pelicula } from '../../task/task-model';

@Component({
  selector: 'app-home',
  imports: [RouterLink, DatePipe],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private peliculasService = inject(PeliculasService);
  private route = inject(ActivatedRoute);

  peliculas = signal<Pelicula[]>([]);
  proximos = signal<Pelicula[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);

  generoSeleccionado = signal<string | null>(null);
  menuAbierto = signal(false);

  generos = computed(() =>
    [...new Set(this.peliculas().flatMap((p) => p.generos))].sort((a, b) => a.localeCompare(b)),
  );

  peliculasFiltradas = computed(() => {
    const genero = this.generoSeleccionado();
    return genero ? this.peliculas().filter((p) => p.generos.includes(genero)) : this.peliculas();
  });

  async ngOnInit() {
    try {
      const [cartelera, proximos] = await Promise.all([
        this.peliculasService.obtenerCartelera(),
        this.peliculasService.obtenerProximos(),
      ]);
      this.peliculas.set(cartelera);
      this.proximos.set(proximos);
    } catch (e: any) {
      this.error.set(e.message);
    } finally {
      this.cargando.set(false);

      // Si se llegó con un fragmento (/#proximos), ahora que hay contenido, scrolleamos
      const fragmento = this.route.snapshot.fragment;
      if (fragmento) {
        setTimeout(() =>
          document.getElementById(fragmento)?.scrollIntoView({ behavior: 'smooth' }),
        );
      }
    }
  }

  alternarMenu() {
    this.menuAbierto.update((v) => !v);
  }

  seleccionar(genero: string | null) {
    this.generoSeleccionado.set(genero);
    this.menuAbierto.set(false);
  }

  @HostListener('document:click')
  @HostListener('document:keydown.escape')
  cerrarMenu() {
    this.menuAbierto.set(false);
  }
}
