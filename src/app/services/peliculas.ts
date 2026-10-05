import { Pelicula } from "../task/task-model";
import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase';

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
            generos: p.peliculas_generos.map((pg: any) => pg.generos.nombre)
        }));
    }

    async obtenerCartelera(): Promise<Pelicula[]> {
        const { data, error } = await this.supabase.client
            .from('peliculas')
            .select(this.columnas)
            .eq('activa', true)
            .lte('fecha_estreno', this.hoy())   // estrenadas: fecha <= hoy
            .order('nombre');

        if (error) throw error;
        return this.mapear(data);
    }

    async obtenerProximos(): Promise<Pelicula[]> {
        const { data, error } = await this.supabase.client
            .from('peliculas')
            .select(this.columnas)
            .eq('activa', true)
            .gt('fecha_estreno', this.hoy())    // próximas: fecha > hoy
            .order('fecha_estreno');

        if (error) throw error;
        return this.mapear(data);
    }
}