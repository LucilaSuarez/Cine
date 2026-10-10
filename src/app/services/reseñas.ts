import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase';
import { Resenia, ResumenPuntuacion } from '../task/task-model';

@Injectable({ providedIn: 'root' })
export class ReseniasService {
    private supabase = inject(SupabaseService);

    // Promedio y cantidad (vista peliculas_puntuacion)
    async resumen(peliculaId: string): Promise<ResumenPuntuacion> {
        const { data, error } = await this.supabase.client
            .from('peliculas_puntuacion')
            .select('promedio, cantidad')
            .eq('pelicula_id', peliculaId)
            .maybeSingle();
        if (error) throw error;
        return {
            promedio: data ? Number(data.promedio) : null,
            cantidad: data ? Number(data.cantidad) : 0,
        };
    }

    async listar(peliculaId: string): Promise<Resenia[]> {
        const { data, error } = await this.supabase.client.rpc('resenias_pelicula', {
            p_pelicula: peliculaId,});
        if (error) throw error;
        return (data ?? []) as Resenia[];
    }

    async puedeResenar(peliculaId: string, usuarioId: string): Promise<boolean> {
        const { data, error } = await this.supabase.client
            .from('compras')
            .select('id, funciones!inner(pelicula_id)')
            .eq('usuario_id', usuarioId)
            .not('entrada_validada_at', 'is', null)
            .eq('funciones.pelicula_id', peliculaId)
            .limit(1);
        if (error) throw error;
        return (data?.length ?? 0) > 0;
    }

  // Crea la reseña o, si ya existía, la actualiza
    async guardar(peliculaId: string, usuarioId: string, puntuacion: number, comentario: string) {
        const { error } = await this.supabase.client.from('resenias').upsert({
            pelicula_id: peliculaId,
            usuario_id: usuarioId,
            puntuacion,
            comentario: comentario.trim() || null,
            updated_at: new Date().toISOString(),},
            { onConflict: 'pelicula_id,usuario_id' },);
        if (error) throw error;
    }

    async eliminar(peliculaId: string, usuarioId: string) {
        const { error } = await this.supabase.client
            .from('resenias')
            .delete()
            .eq('pelicula_id', peliculaId)
            .eq('usuario_id', usuarioId);
        if (error) throw error;
    }
}