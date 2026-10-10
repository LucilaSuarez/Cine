import { Injectable, computed, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase';
import { Butaca, FuncionDetalle, ItemCompra, Producto, Comprobante } from '../task/task-model';

@Injectable({
    providedIn: 'root',
})
export class CompraService {
    funcion = signal<FuncionDetalle | null>(null);
    butacas = signal<Butaca[]>([]);
    items = signal<ItemCompra[]>([]);
    recargoVip = signal(0);
    private supabase = inject(SupabaseService);

    subtotalCandy = computed(() =>
       this.items().reduce((total, item) => total + item.producto.precio * item.cantidad, 0),
    );

    guardarFuncion(funcion: FuncionDetalle) {
        this.funcion.set(funcion);
    }
    guardarButacas(butacas: Butaca[]) {
        this.butacas.set(butacas);
    }

    agregarProducto(producto: Producto) {
        const actual = this.items();
        const existente = actual.find((item) => item.producto.id === producto.id);

        if (existente) {
            this.items.set(
                actual.map((item) =>
                item.producto.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item,
            ),);
            return;
        }

        this.items.set([...actual,
            { producto, cantidad: 1,
        },]);
    }

    quitarProducto(productoId: string) {
        const actual = this.items();
        const existente = actual.find((item) => item.producto.id === productoId);

        if (!existente) return;
        if (existente.cantidad === 1) {
            this.items.set(actual.filter((item) => item.producto.id !== productoId));
            return;
        }

        this.items.set(
            actual.map((item) =>
            item.producto.id === productoId ? { ...item, cantidad: item.cantidad - 1 } : item,
        ),);
    }

    guardarRecargoVip(recargo: number) {
        this.recargoVip.set(recargo);
    }

    async crearCompra(aceptoRestriccion: boolean = false) {
        const funcion = this.funcion();

        if (!funcion) {
            throw new Error('No hay una función seleccionada.');
        }

        if (this.butacas().length === 0) {
            throw new Error('No hay butacas seleccionadas.');
        }

        const items = this.items().map((item) => ({
            producto_id: item.producto.id,
            cantidad: item.cantidad,
        }));

        const { data, error } = await this.supabase.client.rpc('crear_compra', {
            p_funcion_id: funcion.id,
            p_butacas: this.butacas().map((butaca) => butaca.id),
            p_items: items,
            p_email_contacto: null,
            p_acepto_restriccion: aceptoRestriccion,
        });
        if (error) {
            throw new Error(error.message);
        }
        return data?.[0] ?? null;
    }

    async obtenerComprobante(qr: string): Promise<Comprobante | null> {
        const { data, error } = await this.supabase.client.rpc('obtener_comprobante', { p_qr: qr });
        if (error) throw new Error(error.message);
        return (data as Comprobante | null) ?? null;
    }

    limpiar() {
        this.funcion.set(null);
        this.butacas.set([]);
        this.items.set([]);
        this.recargoVip.set(0);
    } 
}
