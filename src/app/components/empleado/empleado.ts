import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase';

@Component({
  selector: 'app-empleado',
  imports: [FormsModule],
  templateUrl: './empleado.html',
  styleUrl: './empleado.css',
})
export class Empleado {
  private supabase = inject(SupabaseService).client;

  codigoEntrada = '';
  codigoCandy = '';

  mensajeEntrada = signal('');
  mensajeCandy = signal('');
  entradaValida = signal(false);

  async validarEntrada() {
    this.mensajeEntrada.set('');
    this.entradaValida.set(false);

    const codigo = this.codigoEntrada.trim();

    if (!codigo) {
      this.mensajeEntrada.set('Ingresá el código de la entrada.');
      return;
    }

    const { data, error } = await this.supabase.rpc('validar_entrada', { p_codigo: codigo });

    if (error) {
      this.mensajeEntrada.set(error.message);
      return;
    }

    this.entradaValida.set(true);
    this.mensajeEntrada.set(data?.mensaje ?? 'Entrada validada correctamente.');

    this.codigoEntrada = '';
  }

  async validarCandy() {
    this.mensajeCandy.set('');

    const codigo = this.codigoCandy.trim();

    if (!codigo) {
      this.mensajeCandy.set('Ingresá el código de la compra.');
      return;
    }

    const { data, error } = await this.supabase.rpc('validar_retiro_candy', { p_codigo: codigo });

    if (error) {
      this.mensajeCandy.set(error.message);
      return;
    }

    const productos = (data?.productos ?? [])
      .map((item: { nombre: string; cantidad: number }) => `${item.nombre} x${item.cantidad}`)
      .join(', ');

    this.mensajeCandy.set(
      `${data?.mensaje ?? 'Retiro validado correctamente.'} Productos: ${productos}`,
    );

    this.codigoCandy = '';
  }
}
