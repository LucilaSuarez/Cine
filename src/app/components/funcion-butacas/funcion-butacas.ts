import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { FormControl, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FuncionesService } from '../../services/funciones';
import {
  Butaca,
  ButacaOcupada,
  EstadoButaca,
  FuncionDetalle,
  TipoButaca,
} from '../../task/task-model';
import { HighlightButacaDirective } from '../../directives/highlight-butaca.directive';
import { PrecioPipe } from '../../pipes/precio-pipe';
import { MAX_BUTACAS, butacasContiguas, maximoButacas } from '../../validators/butacas-validators';
import { CompraService } from '../../services/compra';

const ZONA = 'America/Argentina/Buenos_Aires';

@Component({
  selector: 'app-funcion-butacas',
  imports: [RouterLink, HighlightButacaDirective, PrecioPipe],
  templateUrl: './funcion-butacas.html',
  styleUrl: './funcion-butacas.css',
})
export class FuncionButacas implements OnInit {
  private servicio = inject(FuncionesService);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);
  readonly maximo = MAX_BUTACAS;
  //carrito de compra
  private router = inject(Router);
  private compra = inject(CompraService);

  funcion = signal<FuncionDetalle | null>(null);
  butacas = signal<Butaca[]>([]);
  ocupadas = signal<ButacaOcupada[]>([]);
  recargoVip = signal(0);
  cargando = signal(true);
  error = signal<string | null>(null);
  aviso = signal<string | null>(null);

  // Selección guardamos la butaca en un signal y la validamos con un FormControl
  seleccion = signal<Butaca[]>([]);
  errores = signal<ValidationErrors | null>(null);
  private control = new FormControl<Butaca[]>([], {
    nonNullable: true,
    validators: [Validators.required, butacasContiguas, maximoButacas()],
  });

  noContiguas = computed(() => !!this.errores()?.['butacasNoContiguas']);
  puedeContinuar = computed(() => this.seleccion().length > 0 && !this.errores());

  private ocupadasIds = computed(() => new Set(this.ocupadas().map((o) => o.butaca_id)));
  private seleccionIds = computed(() => new Set(this.seleccion().map((b) => b.id)));

  // Agrupa las butacas por fila y sector
  filas = computed(() => {
    const mapa = new Map<string, Butaca[][]>();
    for (const b of this.butacas()) {
      if (!mapa.has(b.fila)) mapa.set(b.fila, [[], [], []]);
      mapa.get(b.fila)![b.sector - 1].push(b);
    }
    return [...mapa]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([fila, sectores]) => ({
        fila,
        sectores: sectores.map((s) => s.sort((x, y) => x.numero - y.numero)),
      }));
  });

  total = computed(() => this.seleccion().reduce((suma, b) => suma + this.precioButaca(b), 0));

  private formatoCuando = new Intl.DateTimeFormat('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: ZONA,
  });
  cuando = computed(() => {
    const f = this.funcion();
    return f ? this.formatoCuando.format(new Date(f.inicio)) : '';
  });

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.cargando.set(false);
      return;
    }

    try {
      const funcion = await this.servicio.obtenerFuncion(id);
      if (!funcion) return;

      // suscripción y después consultamos, así no se pierde ningún cambio intermedio
      const canal = this.servicio.suscribirOcupadas(
        id,
        (o) => this.alOcuparse(o),
        (idFila) => this.alLiberarse(idFila),
      );
      this.destroyRef.onDestroy(() => this.servicio.quitarSuscripcion(canal));

      const [butacas, ocupadas, recargo] = await Promise.all([
        this.servicio.obtenerButacas(funcion.sala_id),
        this.servicio.obtenerOcupadas(id),
        this.servicio.obtenerRecargoVip(),
      ]);

      this.butacas.set(butacas);
      this.ocupadas.update((actual) => [
        ...ocupadas,
        ...actual.filter((a) => !ocupadas.some((o) => o.id === a.id)),
      ]);
      this.recargoVip.set(recargo);
      this.funcion.set(funcion);
    } catch (e: any) {
      this.error.set(e.message);
    } finally {
      this.cargando.set(false);
    }
  }

  estado(b: Butaca): EstadoButaca {
    if (this.ocupadasIds().has(b.id)) return 'ocupada';
    if (this.seleccionIds().has(b.id)) return 'seleccionada';
    return 'libre';
  }

  precioButaca(b: Butaca): number {
    return (this.funcion()?.precio ?? 0) + (b.tipo === 'vip' ? this.recargoVip() : 0);
  }

  etiquetaTipo(tipo: TipoButaca): string {
    return { estandar: 'Estándar', accesible: 'Accesible', vip: 'VIP' }[tipo];
  }

  alternar(b: Butaca) {
    this.aviso.set(null);
    if (this.estado(b) === 'ocupada') return;

    const actual = this.seleccion();
    if (actual.some((x) => x.id === b.id)) {
      this.aplicarSeleccion(actual.filter((x) => x.id !== b.id));
      return;
    }
    if (actual.length >= MAX_BUTACAS) {
      this.aviso.set(`Podés elegir hasta ${MAX_BUTACAS} butacas por compra.`);
      return;
    }
    this.aplicarSeleccion([...actual, b]);
  }

  private aplicarSeleccion(lista: Butaca[]) {
    const ordenada = [...lista].sort((a, b) => a.fila.localeCompare(b.fila) || a.numero - b.numero);
    this.seleccion.set(ordenada);
    this.control.setValue(ordenada); // dispara los validadores
    this.errores.set(this.control.errors);
  }

  // Alguien compró una butaca mientras mirábamos el mapa
  private alOcuparse(o: ButacaOcupada) {
    this.ocupadas.update((lista) =>
      lista.some((x) => x.butaca_id === o.butaca_id) ? lista : [...lista, o],
    );

    const perdida = this.seleccion().find((b) => b.id === o.butaca_id);
    if (perdida) {
      this.aplicarSeleccion(this.seleccion().filter((b) => b.id !== perdida.id));
      this.aviso.set(
        `La butaca ${perdida.fila}${perdida.numero} acaba de ser ocupada por otra persona.`,
      );
    }
  }

  // Se liberó una butaca
  private alLiberarse(idFila: string) {
    this.ocupadas.update((lista) => lista.filter((o) => o.id !== idFila));
  }

  continuar() {
    if (!this.puedeContinuar()) return;

    const funcion = this.funcion();

    if (!funcion) return;

    this.compra.guardarFuncion(funcion);
    this.compra.guardarButacas(this.seleccion());
    this.compra.guardarRecargoVip(this.recargoVip());

    this.router.navigate(['/candy-bar']);
  }
}
