import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'edad' })
export class EdadPipe implements PipeTransform {
  transform(edadMinima: number | null | undefined): string {
    return edadMinima ? `+${edadMinima}` : 'ATP'; // ATP = apta para todo público
  }
}
