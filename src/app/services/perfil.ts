import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase';
import { Pelicula } from '../task/task-model';

export interface PeliculaAsistida {
  pelicula: Pelicula;
  fechaFuncion: string;
}

@Injectable({
  providedIn: 'root',
})
export class PerfilService {
  private supabase = inject(SupabaseService);

  readonly peliculasAsistidas = signal<PeliculaAsistida[]>([]);
  readonly cargandoPeliculas = signal(false);

  async cargarPeliculasAsistidas(usuarioId: string) {
    this.cargandoPeliculas.set(true);

    const { data, error } = await this.supabase.client
      .from('compras')
      .select( ` funcion_id, entrada_validada_at,
        funciones (inicio, peliculas 
        (id, nombre, sinopsis, duracion_min,
        poster_url, edad_minima, fecha_estreno, generos)) `, )
      .eq('usuario_id', usuarioId)
      .not('entrada_validada_at', 'is', null)
      .order('created_at', { ascending: false });

    this.cargandoPeliculas.set(false);

    if (error) {
      throw new Error(error.message);
    }

    const peliculas: PeliculaAsistida[] = [];

    for (const compra of data ?? []) {
      const funcion = compra.funciones?.[0];
      const pelicula = funcion?.peliculas?.[0];

      if (!funcion || !pelicula) {
        continue;
      }

      peliculas.push({
        pelicula,
        fechaFuncion: funcion.inicio,
      });
    }

    this.peliculasAsistidas.set(peliculas);
  }
}
