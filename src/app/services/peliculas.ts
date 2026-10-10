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

    // Las más vendidas, en orden de ranking (usa el RPC peliculas_mas_vendidas)
  async obtenerMasVendidas(limite = 3): Promise<Pelicula[]> {
    const { data: ranking, error: errRanking } = await this.supabase.client.rpc(
      'peliculas_mas_vendidas',
      { p_limite: limite },
    );
    if (errRanking) throw errRanking;

    const ids: string[] = (ranking ?? []).map((r: any) => r.pelicula_id);
    if (ids.length === 0) return [];

    const { data, error } = await this.supabase.client
      .from('peliculas')
      .select(this.columnas)
      .in('id', ids)
      .eq('activa', true)
      .lte('fecha_estreno', this.hoy()); // solo las que están en cartelera

    if (error) throw error;

    // Respetamos el orden del ranking
    const mapeadas = this.mapear(data);
    return ids
      .map((id) => mapeadas.find((p) => p.id === id))
      .filter((p): p is Pelicula => !!p);
  }

  // Búsqueda por nombre (RF-02.3)
  async buscar(texto: string): Promise<Pelicula[]> {
    const limpio = texto.trim().replace(/[%_,]/g, ' '); // evita comodines del ilike
    if (!limpio) return [];

    const { data, error } = await this.supabase.client
      .from('peliculas')
      .select(this.columnas)
      .eq('activa', true)
      .ilike('nombre', `%${limpio}%`)
      .order('nombre');

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
