import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase';
import { Producto } from '../task/task-model';

@Injectable({ providedIn: 'root' })
export class CandyService {
  private supabase = inject(SupabaseService);

  async obtenerProductos(): Promise<Producto[]> {
    const { data, error } = await this.supabase.client
      .from('productos')
      .select('id, nombre, imagen_url, precio, categorias_producto(nombre)')
      .eq('activo', true)
      .order('nombre');

    if (error) throw error;

    return (data ?? []).map((p: any) => ({
      id: p.id,
      nombre: p.nombre,
      imagen_url: p.imagen_url,
      precio: p.precio,
      categoria: p.categorias_producto?.nombre ?? 'Otros',
    }));
  }
}
