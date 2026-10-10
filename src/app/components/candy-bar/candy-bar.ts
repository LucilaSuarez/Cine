import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CandyService } from '../../services/candy';
import { CompraService } from '../../services/compra';
import { Producto } from '../../task/task-model';
import { PrecioPipe } from '../../pipes/precio-pipe';

@Component({
  imports: [PrecioPipe],
  selector: 'app-candy-bar',
  styleUrl: './candy-bar.css',
  templateUrl: './candy-bar.html',
})
export class CandyBar implements OnInit {
  private candy = inject(CandyService);
  private compra = inject(CompraService);
  private router = inject(Router);

  productos = signal<Producto[]>([]);
  cargando = signal(true);
  error = signal<string | null>(null);

  grupos = computed(() => {
    const mapa = new Map<string, Producto[]>();

    for (const p of this.productos()) {
      mapa.set(p.categoria, [...(mapa.get(p.categoria) ?? []), p]);
    }

    return [...mapa].map(([categoria, productos]) => ({ categoria, productos }));
  });

  items = this.compra.items;
  subtotal = this.compra.subtotalCandy;

  async ngOnInit() {
    try {
      this.productos.set(await this.candy.obtenerProductos());
    } catch (e: any) {
      this.error.set(e.message);
    } finally {
      this.cargando.set(false);
    }
  }

  cantidad(productoId: string): number {
    return this.items().find((item) => item.producto.id === productoId)?.cantidad ?? 0;
  }

  agregar(producto: Producto) {
    this.compra.agregarProducto(producto);
  }

  quitar(producto: Producto) {
    this.compra.quitarProducto(producto.id);
  }

  continuar() {
    this.router.navigate(['/resumen-compra']);
  }
}
