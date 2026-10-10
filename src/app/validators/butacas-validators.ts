import { ValidatorFn } from '@angular/forms';
import { Butaca } from '../task/task-model';

export const MAX_BUTACAS = 10;

// Contiguas = misma fila, mismo sector y números consecutivos
export function sonContiguas(butacas: Butaca[]): boolean {
  if (butacas.length <= 1) return true;

  const { fila, sector } = butacas[0];
  if (!butacas.every((b) => b.fila === fila && b.sector === sector)) return false;

  const numeros = butacas.map((b) => b.numero).sort((a, b) => a - b);
  return numeros.every((n, i) => i === 0 || n === numeros[i - 1] + 1);
}

export const butacasContiguas: ValidatorFn = (control) => {
  const butacas = (control.value ?? []) as Butaca[];
  return sonContiguas(butacas) ? null : { butacasNoContiguas: true };
};

export const maximoButacas =
  (max = MAX_BUTACAS): ValidatorFn =>
  (control) => {
    const butacas = (control.value ?? []) as Butaca[];
    return butacas.length > max ? { maximoButacas: { max } } : null;
  };
