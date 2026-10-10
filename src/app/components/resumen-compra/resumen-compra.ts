import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CompraService } from '../../services/compra';
import { DatePipe } from '@angular/common';
import { PrecioPipe } from '../../pipes/precio-pipe';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-resumen-compra',
  imports: [RouterLink, DatePipe, PrecioPipe],
  templateUrl: './resumen-compra.html',
  styleUrl: './resumen-compra.css',
})
export class ResumenCompra {
  compra = inject(CompraService);
  funcion = this.compra.funcion;
  butacas = this.compra.butacas;
  items = this.compra.items;
  subtotalCandy = this.compra.subtotalCandy;
  private router = inject(Router);
  confirmando = signal(false);
  error = signal<string | null>(null);
  auth = inject(AuthService);
  mostrarAdvertencia = signal(false);

  subtotalEntradas = computed(() =>
    this.butacas().reduce(
      (total, butaca) =>
        total +
        (this.funcion()?.precio ?? 0) +
        (butaca.tipo === 'vip' ? this.compra.recargoVip() : 0),
      0,
    ),
  );

  async confirmarCompra() {
    if (this.confirmando()) return;
    const funcion = this.funcion();
    if (!funcion) return;
    const esAnonimo = !this.auth.estaLogueado();
    const tieneRestriccion = funcion.pelicula.edad_minima > 0;
    if (esAnonimo && tieneRestriccion) {
      this.mostrarAdvertencia.set(true);
      return;
    }
    await this.procesarCompra(false);
  }

  cerrarAdvertencia() {
    this.mostrarAdvertencia.set(false);
  }

  async aceptarAdvertencia() {
    this.mostrarAdvertencia.set(false);
    await this.procesarCompra(true);
  }

  private async procesarCompra(aceptoRestriccion: boolean) {
    this.confirmando.set(true);
    this.error.set(null);

    try {
      const resultado = await this.compra.crearCompra(aceptoRestriccion);

      if (!resultado?.qr_codigo) {
        throw new Error('La compra se creó, pero no se recibió el código QR.');
      }

      await this.router.navigate(['/comprobante', resultado.qr_codigo]);
      this.compra.limpiar();
    } catch (e: any) {
      this.error.set(e.message);
    } finally {
      this.confirmando.set(false);
    }
  }

  total = computed(() => this.subtotalEntradas() + this.subtotalCandy());

  cantidadItems = computed(() => this.items().reduce((total, item) => total + item.cantidad, 0));
}
