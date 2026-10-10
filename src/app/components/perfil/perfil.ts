import { Component, inject, OnInit, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { PerfilService } from '../../services/perfil';
import { CompraService } from '../../services/compra';

@Component({
  selector: 'app-perfil',
  imports: [DatePipe, CurrencyPipe, RouterLink],
  templateUrl: './perfil.html',
  styleUrl: './perfil.css',
})
export class Perfil implements OnInit {
  readonly auth = inject(AuthService);
  readonly perfilService = inject(PerfilService);

  private compraSrv = inject(CompraService);
  compras = signal<any[]>([]); 
  mensaje = signal('');
  error = signal('');

  async cargarCompras() {
    this.compras.set(await this.compraSrv.misCompras());
  }

  puedeCancelar(c: any): boolean {
    const inicio = new Date(c.funciones?.inicio).getTime();
    return c.estado !== 'cancelada'
    && !c.entrada_validada_at && inicio - Date.now() > 2 * 60 * 60 * 1000;
  }

  async cancelar(c: any) {
    if (!confirm('¿Cancelar la compra? Se te devolverá el total como crédito a favor.')) return;
    this.error.set(''); this.mensaje.set('');
    try {
      await this.compraSrv.cancelarCompra(c.id);
      this.mensaje.set('Compra cancelada. El importe quedó como crédito a favor.');
      await this.cargarCompras();
      await this.perfilService.cargarSaldo(this.auth.perfil()!.id);
    } catch (e: any) {
      this.error.set(e.message ?? 'No se pudo cancelar');
    }
  }

  async ngOnInit() {
    await this.auth.lista;
    const id = this.auth.perfil()?.id;
    if (!id) return;

    await Promise.allSettled([
      this.perfilService.cargarPeliculasAsistidas(id),
      this.perfilService.cargarSaldo(id),
      this.cargarCompras(),
    ]);
  }
}
