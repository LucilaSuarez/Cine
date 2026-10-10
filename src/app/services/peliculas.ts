import { Pelicula } from '../task/task-model';
import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase';
import { PeliculaConFunciones } from '../task/task-model';

@Injectable({ providedIn: 'root' })
export class PeliculasService {
  private supabase = inject(SupabaseService);

  private readonly columnas =
    'id, nombre, sinopsis, duracion_min, poster_url, edad_minima, fecha_estreno, peliculas_generos(generos(nombre))';

  private hoy(): string {
    return new Date().toISOString().slice(0, 10);
  }

  // Aplanamos los géneros: [{generos:{nombre:'Drama'}}] -> ['Drama']
  private mapear(data: any[] | null): Pelicula[] {
    return (data ?? []).map((p: any) => ({
      ...p,
      generos: p.peliculas_generos.map((pg: any) => pg.generos.nombre),
    }));
  }

  async obtenerCartelera(): Promise<Pelicula[]> {
    const { data, error } = await this.supabase.client
      .from('peliculas')
      .select(this.columnas)
      .eq('activa', true)
      .lte('fecha_estreno', this.hoy()) // estrenadas: fecha <= hoy
      .order('nombre');

    if (error) throw error;
    return this.mapear(data);
  }

  async obtenerProximos(): Promise<Pelicula[]> {
    const { data, error } = await this.supabase.client
      .from('peliculas')
      .select(this.columnas)
      .eq('activa', true)
      .gt('fecha_estreno', this.hoy()) // próximas: fecha > hoy
      .order('fecha_estreno');

    if (error) throw error;
    return this.mapear(data);
  }

  async obtenerPelicula(id: string): Promise<PeliculaConFunciones | null> {
    const { data, error } = await this.supabase.client
      .from('peliculas')
      .select(`id, nombre, sinopsis, duracion_min, poster_url, edad_minima, fecha_estreno,
        peliculas_generos(generos(nombre)),
        funciones(id, inicio, fin, formato, idioma, precio, salas(nombre))`,)
      .eq('id', id)
      .eq('activa', true)
      .eq('funciones.activa', true)
      .gt('funciones.inicio', new Date().toISOString()) // solo funciones futuras
      .order('inicio', { referencedTable: 'funciones' })
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const p: any = data;
    return {
      ...p,
      generos: p.peliculas_generos.map((pg: any) => pg.generos.nombre),
      funciones: p.funciones.map((f: any) => ({ ...f, sala: f.salas?.nombre ?? '' })),
    };
  }
}
