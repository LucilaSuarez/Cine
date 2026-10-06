import { ValidatorFn } from '@angular/forms';

// La fecha de nacimiento no puede ser futura ni de hace más de 120 años
export const fechaNacimientoValida: ValidatorFn = (control) => {
    const valor = control.value;
    if (!valor) return null;                       // "required" se encarga de los vacíos

    const fecha = new Date(valor + 'T00:00:00');
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fecha > hoy) return { fechaFutura: true };

    const limite = new Date(hoy);
    limite.setFullYear(hoy.getFullYear() - 120);
    if (fecha < limite) return { fechaMuyAntigua: true };

    return null;
};

// Validador de grupo: compara dos campos entre sí
export const passwordsIguales: ValidatorFn = (grupo) => {
    const password = grupo.get('password')?.value;
    const confirmar = grupo.get('confirmar')?.value;
    return password && confirmar && password !== confirmar
        ? { passwordsDistintas: true }
        : null;
};