import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase';
import { Pelicula, PeliculaAsistida } from '../task/task-model';

const unico = <T>(valor: T | T[] | null | undefined): T | undefined =>
  Array.isArray(valor) ? valor[0] : (valor ?? undefined);

@Injectable({
  providedIn: 'root',
})


export class PerfilService {
  private supabase = inject(SupabaseService);

  readonly peliculasAsistidas = signal<PeliculaAsistida[]>([]);
  readonly cargandoPeliculas = signal(false);
  readonly saldoCredito = signal(0);
  readonly saldoPuntos  = signal(0);
  readonly misPuntuaciones = signal<Record<string, number>>({});

  async cargarSaldo(usuarioId: string) {
    const { data } = await this.supabase.client
      .from('perfiles')
      .select('saldo_credito, saldo_puntos')
      .eq('id', usuarioId)
      .single();
    this.saldoCredito.set(Number(data?.saldo_credito ?? 0));
    this.saldoPuntos.set(Number(data?.saldo_puntos ?? 0));
  }

  async cargarPeliculasAsistidas(usuarioId: string) {
    this.cargandoPeliculas.set(true);

    const { data, error } = await this.supabase.client
      .from('compras')
      .select(`
        funcion_id, entrada_validada_at,
        funciones (
          inicio,
          peliculas (
            id, nombre, sinopsis, duracion_min,
            poster_url, edad_minima, fecha_estreno
          ) )`)
      .eq('usuario_id', usuarioId)
      .not('entrada_validada_at', 'is', null)
      .order('created_at', { ascending: false });

    this.cargandoPeliculas.set(false);
    const { data: resenias } = await this.supabase.client
      .from('resenias')
      .select('pelicula_id, puntuacion')
      .eq('usuario_id', usuarioId);

    this.misPuntuaciones.set(
      Object.fromEntries((resenias ?? []).map((r: any) => [r.pelicula_id, r.puntuacion])),
    );

    if (error) {
      throw new Error(error.message);
    }

    const peliculas: PeliculaAsistida[] = [];

    for (const compra of (data ?? []) as any[]) {
      const funcion = unico<any>(compra.funciones);
      const pelicula = unico<any>(funcion?.peliculas);

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
