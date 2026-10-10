import { Directive, input } from '@angular/core';

// RF-01.7, RF-01.8
@Directive({
    selector: '[appRestrictEdad]',
    host: {
        '[style.display]': 'edadMinima() > 0 ? "block" : "none"',
    },
})
export class RestrictEdadDirective {
    edadMinima = input.required<number>({
        alias: 'appRestrictEdad',
    });
}
