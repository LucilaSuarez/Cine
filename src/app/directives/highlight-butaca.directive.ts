import { Directive, computed, input } from '@angular/core';
import { EstadoButaca, TipoButaca } from '../task/task-model';
// RTC-12, RF-03.1, RF-03.2
@Directive({
  selector: '[appHighlightButaca]',
  host: {
    '[style.background-color]': 'colores().fondo',
    '[style.border-color]': 'colores().borde',
    '[style.color]': 'colores().texto',
    '[style.cursor]': "estado() === 'ocupada' ? 'not-allowed' : 'pointer'",
  },
})
export class HighlightButacaDirective {
  tipo = input.required<TipoButaca>({ alias: 'appHighlightButaca' });
  estado = input.required<EstadoButaca>({ alias: 'butacaEstado' });

  colores = computed(() => {
    if (this.estado() === 'ocupada') {
      return { fondo: '#1f1f1f', borde: '#2a2a2a', texto: '#555' };
    }
    if (this.estado() === 'seleccionada') {
      return { fondo: '#1009e5', borde: '#ffffff', texto: '#ffffff' };
    }
    switch (this.tipo()) {
      case 'vip':
        return { fondo: '#100f3b', borde: '#2e38c4', texto: '#e6e6e6' };
      case 'accesible':
        return { fondo: '#044964', borde: '#2e86c4', texto: '#e6e6e6' };
      default:
        return { fondo: '#3b4252', borde: '#566074', texto: '#e6e6e6' };
    }
  });
}
