import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { CompraService } from '../../services/compra';
import { PerfilService } from '../../services/perfil';
import { AuthService } from '../../services/auth';
import { PrecioPipe } from '../../pipes/precio-pipe';

@Component({
  selector: 'app-resumen-compra',
  imports: [RouterLink, DatePipe, PrecioPipe],
  templateUrl: './resumen-compra.html',
  styleUrl: './resumen-compra.css',
})
export class ResumenCompra implements OnInit {
  compra = inject(CompraService);
  funcion = this.compra.funcion;
  butacas = this.compra.butacas;
  items = this.compra.items;
  subtotalCandy = this.compra.subtotalCandy;
  private router = inject(Router);
  private perfilService = inject(PerfilService);
  auth = inject(AuthService);

  confirmando = signal(false);
  error = signal<string | null>(null);
  mostrarAdvertencia = signal(false);

  // Crédito a favor
  usarCredito = signal(false);
  saldo = this.perfilService.saldoCredito;

  subtotalEntradas = computed(() =>
    this.butacas().reduce(
      (total, butaca) =>
        total +
        (this.funcion()?.precio ?? 0) +
        (butaca.tipo === 'vip' ? this.compra.recargoVip() : 0), 0,),
  );

  total = computed(() => this.subtotalEntradas() + this.subtotalCandy());

  // Lo que se descuenta del crédito (nunca más que el total ni más que el saldo)
  creditoAplicado = computed(() =>
    this.usarCredito() ? Math.min(this.saldo(), this.total()) : 0,
  );

  totalAPagar = computed(() => this.total() - this.creditoAplicado());

  cantidadItems = computed(() => this.items().reduce((total, item) => total + item.cantidad, 0));

  async ngOnInit() {
    await this.auth.lista;
    const id = this.auth.perfil()?.id;
    if (id) {
      await this.perfilService.cargarSaldo(id);
    }
  }

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
      const resultado = await this.compra.crearCompra(aceptoRestriccion, this.usarCredito());

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
}