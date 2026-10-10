import { Injectable, inject } from '@angular/core';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { SupabaseService } from './supabase';
import { Butaca, ButacaOcupada, FuncionDetalle } from '../task/task-model';

@Injectable({ providedIn: 'root' })
export class FuncionesService {
  private client = inject(SupabaseService).client;

  async obtenerFuncion(id: string): Promise<FuncionDetalle | null> {
    const { data, error } = await this.client
      .from('funciones')
      .select(
        'id, inicio, formato, idioma, precio, sala_id, salas(nombre), peliculas(id, nombre, edad_minima, poster_url)',
      )
      .eq('id', id)
      .eq('activa', true)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const f: any = data;
    return {
      id: f.id,
      inicio: f.inicio,
      formato: f.formato,
      idioma: f.idioma,
      precio: f.precio,
      sala_id: f.sala_id,
      sala: f.salas?.nombre ?? '',
      pelicula: f.peliculas,
    };
  }

  async obtenerButacas(salaId: string): Promise<Butaca[]> {
    const { data, error } = await this.client
      .from('butacas')
      .select('id, fila, numero, sector, tipo')
      .eq('sala_id', salaId)
      .order('fila')
      .order('numero');

    if (error) throw error;
    return (data ?? []) as Butaca[];
  }

  async obtenerOcupadas(funcionId: string): Promise<ButacaOcupada[]> {
    const { data, error } = await this.client
      .from('butacas_ocupadas')
      .select('id, funcion_id, butaca_id')
      .eq('funcion_id', funcionId);

    if (error) throw error;
    return (data ?? []) as ButacaOcupada[];
  }

  async obtenerRecargoVip(): Promise<number> {
    const { data } = await this.client
      .from('parametros')
      .select('valor')
      .eq('clave', 'recargo_vip')
      .maybeSingle();
    return Number(data?.valor ?? 0);
  }

  // Aviso de cuando se ocupa o se libera una butaca (RF-03.4 / RNF-13 / RNF-14)
  suscribirOcupadas(
    funcionId: string,
    alOcuparse: (o: ButacaOcupada) => void,
    alLiberarse: (idFila: string) => void,
  ): RealtimeChannel {
    return (
      this.client
        .channel(`ocupadas-${funcionId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'butacas_ocupadas',
            filter: `funcion_id=eq.${funcionId}`,
          },
          (payload) => alOcuparse(payload.new as ButacaOcupada),
        )
        // Los DELETE no se pueden filtrar por columna: llega solo el id de la fila y el componente ignora los que no conoce
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'butacas_ocupadas' },
          (payload) => alLiberarse((payload.old as { id: string }).id),
        )
        .subscribe()
    );
  }

  quitarSuscripcion(canal: RealtimeChannel) {
    this.client.removeChannel(canal);
  }
}