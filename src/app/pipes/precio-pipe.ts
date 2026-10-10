import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'precio' })
export class PrecioPipe implements PipeTransform {
  private formato = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  });

  transform(valor: number | null | undefined): string {
    return valor == null ? '' : this.formato.format(valor);
  }
}
