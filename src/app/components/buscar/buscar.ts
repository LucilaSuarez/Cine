import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { PeliculasService } from '../../services/peliculas';
import { Pelicula } from '../../task/task-model';

@Component({
  selector: 'app-buscar',
  imports: [RouterLink, DatePipe],
  templateUrl: './buscar.html',
  styleUrl: './buscar.css',
})
export class Buscar implements OnInit {
  private peliculasService = inject(PeliculasService);
  private route = inject(ActivatedRoute);

  texto = signal('');
  resultados = signal<Pelicula[]>([]);
  buscando = signal(false);
  buscado = signal(false);
  error = signal<string | null>(null);
  private temporizador: any;

  ngOnInit() {
    const q = this.route.snapshot.queryParamMap.get('q');
    if (q) {
      this.texto.set(q);
      this.ejecutar();
    }
  }

  // Espera 300 ms después de la última tecla para no consultar en cada letra
  alEscribir(valor: string) {
    this.texto.set(valor);
    clearTimeout(this.temporizador);
    this.temporizador = setTimeout(() => this.ejecutar(), 300);
  }

  async ejecutar() {
    const consulta = this.texto().trim();
    if (consulta.length < 2) {
      this.resultados.set([]);
      this.buscado.set(false);
      return;
    }

    this.buscando.set(true);
    this.error.set(null);
    try {
      const encontrados = await this.peliculasService.buscar(consulta);
      // Si el usuario siguió escribiendo mientras esperaba, descartamos este resultado
      if (consulta === this.texto().trim()) {
        this.resultados.set(encontrados);
        this.buscado.set(true);
      }
    } catch (e: any) {
      this.error.set(e.message);
    } finally {
      this.buscando.set(false);
    }
  }
}