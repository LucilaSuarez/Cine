import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [FormsModule, DatePipe, CurrencyPipe],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin {
  private supabase = inject(SupabaseService).client;

  // Peliculas
  seccionActiva = signal('peliculas');
  peliculas = signal<any[]>([]);
  cargando = signal(false);
  guardando = signal(false);
  error = signal('');
  mensaje = signal('');
  mostrarFormulario = signal(false);
  peliculaEditando: any = null;
  formulario = this.nuevaPelicula();

  //salas
  salas = signal<any[]>([]);
  cargandoSalas = signal(false);
  guardandoSala = signal(false);
  mostrarFormularioSala = signal(false);
  salaEditando: any = null;
  errorSala = signal('');
  mensajeSala = signal('');
  formularioSala = this.nuevaSala();

  //Funciones
  funciones = signal<any[]>([]);
  peliculasParaFunciones = signal<any[]>([]);
  salasParaFunciones = signal<any[]>([]);
  cargandoFunciones = signal(false);
  guardandoFuncion = signal(false);
  mostrarFormularioFuncion = signal(false);
  funcionEditando: any = null;
  errorFuncion = signal('');
  mensajeFuncion = signal('');
  formularioFuncion = this.nuevaFuncion();
  formatosProyeccion = ['2D', '3D', '4D', '5D'];
  idiomasFuncion = ['castellano', 'subtitulado'];

  // Candy Bar: productos y categorías
  productos = signal<any[]>([]);
  categoriasProducto = signal<any[]>([]);
  cargandoProductos = signal(false);
  guardandoProducto = signal(false);
  mostrarFormularioProducto = signal(false);
  productoEditando: any = null;
  errorProducto = signal('');
  mensajeProducto = signal('');
  formularioProducto = this.nuevoProducto();

  
  // Reportes
  cargandoReportes = signal(false);
  errorReporte = signal('');
  ingresosTotales = signal(0);
  comprasConfirmadas = signal(0);
  comprasCanceladas = signal(0);
  entradasVendidas = signal(0);

  ventasPorFuncion = signal<any[]>([]);
  productosMasVendidos = signal<any[]>([]);
  peliculasMasVistas = signal<any[]>([]);


  constructor() {
    this.cargarPeliculas();
    this.cargarSalas();
    this.cargarFunciones();
    this.cargarProductos();
    this.cargarCategoriasProducto();
    this.cargarReportes();
  }

  cambiarSeccion(seccion: string) {
    this.seccionActiva.set(seccion);
    this.error.set('');
    this.mensaje.set('');
  }

  nuevaPelicula() {
    return {
      nombre: '',
      sinopsis: '',
      duracion_min: 90,
      poster_url: '',
      edad_minima: 0,
      fecha_estreno: '',
      preventa_habilitada: false,
      preventa_desde: '',
      preventa_hasta: '',
      precio_preventa: null as number | null,
      activa: true,
    };
  }

  async cargarPeliculas() {
    this.cargando.set(true);
    this.error.set('');

    const { data, error } = await this.supabase
      .from('peliculas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      this.error.set('No se pudieron cargar las películas: ' + error.message);
    } else {
      this.peliculas.set(data ?? []);
    }

    this.cargando.set(false);
  }

  nueva() {
    this.peliculaEditando = null;
    this.formulario = this.nuevaPelicula();
    this.error.set('');
    this.mensaje.set('');
    this.mostrarFormulario.set(true);
  }

  editar(pelicula: any) {
    this.peliculaEditando = pelicula;

    this.formulario = {
      nombre: pelicula.nombre ?? '',
      sinopsis: pelicula.sinopsis ?? '',
      duracion_min: pelicula.duracion_min ?? 90,
      poster_url: pelicula.poster_url ?? '',
      edad_minima: pelicula.edad_minima ?? 0,
      fecha_estreno: pelicula.fecha_estreno ?? '',
      preventa_habilitada: pelicula.preventa_habilitada ?? false,
      preventa_desde: pelicula.preventa_desde ?? '',
      preventa_hasta: pelicula.preventa_hasta ?? '',
      precio_preventa: pelicula.precio_preventa ?? null,
      activa: pelicula.activa ?? true,
    };

    this.error.set('');
    this.mensaje.set('');
    this.mostrarFormulario.set(true);
  }

  cancelarFormulario() {
    this.mostrarFormulario.set(false);
    this.peliculaEditando = null;
    this.formulario = this.nuevaPelicula();
    this.error.set('');
  }

  async guardarPelicula() {
    this.error.set('');
    this.mensaje.set('');

    if (!this.formulario.nombre.trim()) {
      this.error.set('El nombre de la película es obligatorio.');
      return;
    }

    if (!this.formulario.duracion_min || this.formulario.duracion_min <= 0) {
      this.error.set('La duración debe ser mayor a cero.');
      return;
    }

    if (this.formulario.edad_minima < 0) {
      this.error.set('La clasificación por edad no puede ser negativa.');
      return;
    }

    this.guardando.set(true);

    const datos = {
      nombre: this.formulario.nombre.trim(),
      sinopsis: this.formulario.sinopsis.trim() || null,
      duracion_min: Number(this.formulario.duracion_min),
      poster_url: this.formulario.poster_url.trim() || null,
      edad_minima: Number(this.formulario.edad_minima),
      fecha_estreno: this.formulario.fecha_estreno || null,
      preventa_habilitada: this.formulario.preventa_habilitada,
      preventa_desde: this.formulario.preventa_desde || null,
      preventa_hasta: this.formulario.preventa_hasta || null,
      precio_preventa:
        this.formulario.precio_preventa === null ? null : Number(this.formulario.precio_preventa),
      activa: this.formulario.activa,
    };

    let errorGuardar;

    if (this.peliculaEditando) {
      const resultado = await this.supabase
        .from('peliculas')
        .update(datos)
        .eq('id', this.peliculaEditando.id);

      errorGuardar = resultado.error;
    } else {
      const resultado = await this.supabase.from('peliculas').insert(datos);

      errorGuardar = resultado.error;
    }

    this.guardando.set(false);

    if (errorGuardar) {
      this.error.set('No se pudo guardar la película: ' + errorGuardar.message);
      return;
    }

    this.mensaje.set(
      this.peliculaEditando
        ? 'Película actualizada correctamente.'
        : 'Película creada correctamente.',
    );

    this.mostrarFormulario.set(false);
    this.peliculaEditando = null;
    this.formulario = this.nuevaPelicula();

    await this.cargarPeliculas();
  }

  async cambiarEstado(pelicula: any) {
    this.error.set('');
    this.mensaje.set('');

    const { error } = await this.supabase
      .from('peliculas')
      .update({ activa: !pelicula.activa })
      .eq('id', pelicula.id);

    if (error) {
      this.error.set('No se pudo cambiar el estado: ' + error.message);
      return;
    }

    this.mensaje.set(
      pelicula.activa ? 'Película desactivada correctamente.' : 'Película activada correctamente.',
    );

    await this.cargarPeliculas();
  }

  //salas

  nuevaSala() {
    return {
      numero: null as number | null,
      nombre: '',
      activa: true,
    };
  }

  async cargarSalas() {
    this.cargandoSalas.set(true);
    this.errorSala.set('');

    const { data, error } = await this.supabase
      .from('salas')
      .select('*')
      .order('numero', { ascending: true });

    if (error) {
      this.errorSala.set('No se pudieron cargar las salas: ' + error.message);
    } else {
      this.salas.set(data ?? []);
    }

    this.cargandoSalas.set(false);
  }

  nuevaSalaFormulario() {
    this.salaEditando = null;
    this.formularioSala = this.nuevaSala();
    this.errorSala.set('');
    this.mensajeSala.set('');
    this.mostrarFormularioSala.set(true);
  }

  editarSala(sala: any) {
    this.salaEditando = sala;

    this.formularioSala = {
      numero: sala.numero,
      nombre: sala.nombre ?? '',
      activa: sala.activa,
    };

    this.errorSala.set('');
    this.mensajeSala.set('');
    this.mostrarFormularioSala.set(true);
  }

  cancelarFormularioSala() {
    this.mostrarFormularioSala.set(false);
    this.salaEditando = null;
    this.formularioSala = this.nuevaSala();
    this.errorSala.set('');
  }

  async guardarSala() {
    this.errorSala.set('');
    this.mensajeSala.set('');

    const numero = Number(this.formularioSala.numero);

    if (!Number.isInteger(numero) || numero <= 0) {
      this.errorSala.set('El número de sala debe ser un entero mayor que cero.');
      return;
    }

    this.guardandoSala.set(true);

    const datos = {
      numero,
      nombre: this.formularioSala.nombre.trim() || null,
      activa: this.formularioSala.activa,
    };

    let errorGuardar;

    if (this.salaEditando) {
      const resultado = await this.supabase
        .from('salas')
        .update(datos)
        .eq('id', this.salaEditando.id);

      errorGuardar = resultado.error;
    } else {
      const resultado = await this.supabase.from('salas').insert(datos);

      errorGuardar = resultado.error;
    }

    this.guardandoSala.set(false);

    if (errorGuardar) {
      this.errorSala.set(
        'No se pudo guardar la sala. Verificá que el número no esté repetido. ' +
          errorGuardar.message,
      );
      return;
    }

    this.mensajeSala.set(
      this.salaEditando ? 'Sala actualizada correctamente.' : 'Sala creada correctamente.',
    );

    this.mostrarFormularioSala.set(false);
    this.salaEditando = null;
    this.formularioSala = this.nuevaSala();

    await this.cargarSalas();
  }

  async cambiarEstadoSala(sala: any) {
    this.errorSala.set('');
    this.mensajeSala.set('');

    const { error } = await this.supabase
      .from('salas')
      .update({ activa: !sala.activa })
      .eq('id', sala.id);

    if (error) {
      this.errorSala.set('No se pudo cambiar el estado de la sala: ' + error.message);
      return;
    }

    this.mensajeSala.set(
      sala.activa ? 'Sala desactivada correctamente.' : 'Sala activada correctamente.',
    );

    await this.cargarSalas();
  }

  // Funciones

  nuevaFuncion() {
    return {
      pelicula_id: '',
      sala_id: '',
      inicio: '',
      formato: '2D',
      idioma: 'castellano',
      precio: 0,
      asignacionAutomatica: false,
    };
  }

  async cargarDatosFunciones() {
    const [peliculas, salas] = await Promise.all([
      this.supabase
        .from('peliculas')
        .select('id, nombre, duracion_min')
        .eq('activa', true)
        .order('nombre'),
      this.supabase.from('salas').select('id, numero, nombre').eq('activa', true).order('numero'),
    ]);

    if (peliculas.error) {
      this.errorFuncion.set('No se pudieron cargar las películas: ' + peliculas.error.message);
    } else {
      this.peliculasParaFunciones.set(peliculas.data ?? []);
    }

    if (salas.error) {
      this.errorFuncion.set('No se pudieron cargar las salas: ' + salas.error.message);
    } else {
      this.salasParaFunciones.set(salas.data ?? []);
    }
  }

  async cargarFunciones() {
    this.cargandoFunciones.set(true);
    this.errorFuncion.set('');

    const { data, error } = await this.supabase
      .from('funciones')
      .select(
        `id,pelicula_id,sala_id, inicio,
          fin, fin_con_margen, formato,
          idioma, precio, activa,
          peliculas (nombre, duracion_min), salas (numero, nombre)
        `,)
      .order('inicio', { ascending: true });

    if (error) {
      this.errorFuncion.set('No se pudieron cargar las funciones: ' + error.message);
    } else {
      this.funciones.set(data ?? []);
    }

    this.cargandoFunciones.set(false);
  }

  nuevaFuncionFormulario() {
    this.funcionEditando = null;
    this.formularioFuncion = this.nuevaFuncion();
    this.errorFuncion.set('');
    this.mensajeFuncion.set('');
    this.mostrarFormularioFuncion.set(true);

    this.cargarDatosFunciones();
  }

  editarFuncion(funcion: any) {
    this.funcionEditando = funcion;

    this.formularioFuncion = {
      pelicula_id: funcion.pelicula_id,
      sala_id: funcion.sala_id ?? '',
      inicio: this.convertirAFechaLocal(funcion.inicio),
      formato: funcion.formato,
      idioma: funcion.idioma,
      precio: funcion.precio,
      asignacionAutomatica: false,
    };

    this.errorFuncion.set('');
    this.mensajeFuncion.set('');
    this.mostrarFormularioFuncion.set(true);

    this.cargarDatosFunciones();
  }

  convertirAFechaLocal(fecha: string) {
    const date = new Date(fecha);
    const ajustarZona = new Date(date.getTime() - date.getTimezoneOffset() * 60000);

    return ajustarZona.toISOString().slice(0, 16);
  }

  cancelarFormularioFuncion() {
    this.mostrarFormularioFuncion.set(false);
    this.funcionEditando = null;
    this.formularioFuncion = this.nuevaFuncion();
    this.errorFuncion.set('');
  }

  async guardarFuncion() {
    this.errorFuncion.set('');
    this.mensajeFuncion.set('');

    if (!this.formularioFuncion.pelicula_id) {
      this.errorFuncion.set('Seleccioná una película.');
      return;
    }

    if (!this.formularioFuncion.inicio) {
      this.errorFuncion.set('Ingresá la fecha y hora de inicio.');
      return;
    }

    if (!this.formularioFuncion.asignacionAutomatica && !this.formularioFuncion.sala_id) {
      this.errorFuncion.set('Seleccioná una sala o elegí la asignación automática.');
      return;
    }

    const precio = Number(this.formularioFuncion.precio);

    if (!Number.isFinite(precio) || precio < 0) {
      this.errorFuncion.set('El precio no puede ser negativo.');
      return;
    }

    if (
      !this.funcionEditando &&
      this.formularioFuncion.asignacionAutomatica &&
      this.salasParaFunciones().length === 0
    ) {
      this.errorFuncion.set('No hay salas activas disponibles.');
      return;
    }

    this.guardandoFuncion.set(true);

    const datos: any = {
      pelicula_id: this.formularioFuncion.pelicula_id,
      inicio: new Date(this.formularioFuncion.inicio).toISOString(),
      formato: this.formularioFuncion.formato,
      idioma: this.formularioFuncion.idioma,
      precio,
    };

    if (this.formularioFuncion.asignacionAutomatica) {
      datos.sala_id = null;
    } else {
      datos.sala_id = this.formularioFuncion.sala_id;
    }

    let errorGuardar;

    if (this.funcionEditando) {
      const resultado = await this.supabase
        .from('funciones')
        .update(datos)
        .eq('id', this.funcionEditando.id);

      errorGuardar = resultado.error;
    } else {
      const resultado = await this.supabase.from('funciones').insert(datos);

      errorGuardar = resultado.error;
    }

    this.guardandoFuncion.set(false);

    if (errorGuardar) {
      this.errorFuncion.set('No se pudo guardar la función: ' + errorGuardar.message);
      return;
    }

    this.mensajeFuncion.set(
      this.funcionEditando ? 'Función actualizada correctamente.' : 'Función creada correctamente.',
    );

    this.mostrarFormularioFuncion.set(false);
    this.funcionEditando = null;
    this.formularioFuncion = this.nuevaFuncion();

    await this.cargarFunciones();
  }

  async cambiarEstadoFuncion(funcion: any) {
    this.errorFuncion.set('');
    this.mensajeFuncion.set('');

    const { error } = await this.supabase
      .from('funciones')
      .update({ activa: !funcion.activa })
      .eq('id', funcion.id);

    if (error) {
      this.errorFuncion.set('No se pudo cambiar el estado de la función: ' + error.message);
      return;
    }

    this.mensajeFuncion.set(
      funcion.activa ? 'Función desactivada correctamente.' : 'Función activada correctamente.',
    );

    await this.cargarFunciones();
  }

  // Candy Bar: productos y categorías

  nuevoProducto() {
    return {
      nombre: '',
      categoria_id: null as number | null,
      imagen_url: '',
      precio: 0,
      activo: true,
    };
  }

  async cargarCategoriasProducto() {
    const { data, error } = await this.supabase
      .from('categorias_producto')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) {
      this.errorProducto.set('No se pudieron cargar las categorías: ' + error.message);
      return;
    }

    this.categoriasProducto.set(data ?? []);
  }

  async cargarProductos() {
    this.cargandoProductos.set(true);
    this.errorProducto.set('');

    const { data, error } = await this.supabase
      .from('productos')
      .select( ` *, categorias_producto (nombre)`,)
      .order('nombre', { ascending: true });

    if (error) {
      this.errorProducto.set('No se pudieron cargar los productos: ' + error.message);
    } else {
      this.productos.set(data ?? []);
    }

    this.cargandoProductos.set(false);
  }

  nuevoProductoFormulario() {
    this.productoEditando = null;
    this.formularioProducto = this.nuevoProducto();
    this.errorProducto.set('');
    this.mensajeProducto.set('');
    this.mostrarFormularioProducto.set(true);
  }

  editarProducto(producto: any) {
    this.productoEditando = producto;

    this.formularioProducto = {
      nombre: producto.nombre ?? '',
      categoria_id: producto.categoria_id ?? null,
      imagen_url: producto.imagen_url ?? '',
      precio: producto.precio ?? 0,
      activo: producto.activo ?? true,
    };

    this.errorProducto.set('');
    this.mensajeProducto.set('');
    this.mostrarFormularioProducto.set(true);
  }

  cancelarFormularioProducto() {
    this.mostrarFormularioProducto.set(false);
    this.productoEditando = null;
    this.formularioProducto = this.nuevoProducto();
    this.errorProducto.set('');
  }

  async guardarProducto() {
    this.errorProducto.set('');
    this.mensajeProducto.set('');

    if (!this.formularioProducto.nombre.trim()) {
      this.errorProducto.set('El nombre del producto es obligatorio.');
      return;
    }

    const precio = Number(this.formularioProducto.precio);

    if (!Number.isFinite(precio) || precio < 0) {
      this.errorProducto.set('El precio debe ser un número mayor o igual a cero.');
      return;
    }

    this.guardandoProducto.set(true);

    const datos = {
      nombre: this.formularioProducto.nombre.trim(),
      categoria_id: this.formularioProducto.categoria_id
        ? Number(this.formularioProducto.categoria_id)
        : null,
      imagen_url: this.formularioProducto.imagen_url.trim() || null,
      precio,
      activo: this.formularioProducto.activo,
    };

    let errorGuardar;

    if (this.productoEditando) {
      const resultado = await this.supabase
        .from('productos')
        .update(datos)
        .eq('id', this.productoEditando.id);

      errorGuardar = resultado.error;
    } else {
      const resultado = await this.supabase.from('productos').insert(datos);

      errorGuardar = resultado.error;
    }

    this.guardandoProducto.set(false);

    if (errorGuardar) {
      if (errorGuardar.code === '23505') {
        this.errorProducto.set('Ya existe un producto con ese nombre.');
      } else {
        this.errorProducto.set('No se pudo guardar el producto: ' + errorGuardar.message);
      }
      return;
    }

    this.mensajeProducto.set(
      this.productoEditando
        ? 'Producto actualizado correctamente.'
        : 'Producto creado correctamente.',
    );

    this.mostrarFormularioProducto.set(false);
    this.productoEditando = null;
    this.formularioProducto = this.nuevoProducto();

    await this.cargarProductos();
  }

  async cambiarEstadoProducto(producto: any) {
    this.errorProducto.set('');
    this.mensajeProducto.set('');

    const { error } = await this.supabase
      .from('productos')
      .update({ activo: !producto.activo })
      .eq('id', producto.id);

    if (error) {
      this.errorProducto.set('No se pudo cambiar el estado del producto: ' + error.message);
      return;
    }

    this.mensajeProducto.set(
      producto.activo ? 'Producto desactivado correctamente.' : 'Producto activado correctamente.',
    );

    await this.cargarProductos();
  }

  // Reportes 
  
  async cargarReportes() {
    this.cargandoReportes.set(true);
    this.errorReporte.set('');

    const [
      resultadoCompras,
      resultadoFunciones,
      resultadoPeliculas,
      resultadoButacas,
      resultadoItems
    ] = await Promise.all([
      this.supabase
        .from('compras')
        .select('id, funcion_id, estado, total, created_at, cancelada_at, entrada_validada_at'),

      this.supabase
        .from('funciones')
        .select('id, pelicula_id, inicio'),

      this.supabase
        .from('peliculas')
        .select('id, nombre'),

      this.supabase
        .from('compra_butacas')
        .select('compra_id, butaca_id, precio'),

      this.supabase
        .from('compra_items')
        .select('compra_id, nombre, cantidad, precio_unitario, producto_id, combo_id')
    ]);

    const error =
      resultadoCompras.error ||
      resultadoFunciones.error ||
      resultadoPeliculas.error ||
      resultadoButacas.error ||
      resultadoItems.error;

    if (error) {
      this.errorReporte.set(
        'No se pudieron cargar los reportes: ' + error.message
      );
      this.cargandoReportes.set(false);
        return;
    }

    const compras = resultadoCompras.data ?? [];
    const funciones = resultadoFunciones.data ?? [];
    const peliculas = resultadoPeliculas.data ?? [];
    const butacas = resultadoButacas.data ?? [];
    const items = resultadoItems.data ?? [];

    const comprasPorId = new Map(
      compras.map(compra => [compra.id, compra])
    );

    const funcionesPorId = new Map(
      funciones.map(funcion => [funcion.id, funcion])
    );

    const peliculasPorId = new Map(
      peliculas.map(pelicula => [pelicula.id, pelicula])
    );

    const confirmadas = compras.filter(
      compra => compra.estado === 'confirmada'
    );

    const canceladas = compras.filter(
      compra => compra.estado === 'cancelada'
    );

    // Resumen general
    this.comprasConfirmadas.set(confirmadas.length);
    this.comprasCanceladas.set(canceladas.length);

    this.ingresosTotales.set(
      confirmadas.reduce((total, compra) => total + Number(compra.total || 0),0)
    );

    const comprasConfirmadasIds = new Set(
      confirmadas.map(compra => compra.id)
    );

    this.entradasVendidas.set(
      butacas.filter(
        butaca => comprasConfirmadasIds.has(butaca.compra_id)
      ).length
    );

    // Ventas por función y película
    const resumenFunciones = new Map<string, any>();

    for (const funcion of funciones) {
      const pelicula = peliculasPorId.get(funcion.pelicula_id);
      resumenFunciones.set(funcion.id, {
        funcion_id: funcion.id,
        pelicula: pelicula?.nombre ?? 'Película sin nombre',
        inicio: funcion.inicio,
        entradasConfirmadas: 0,
        entradasCanceladas: 0,
        comprasConfirmadas: 0,
        comprasCanceladas: 0
      });
    }

    for (const compra of compras) {
      const resumen = resumenFunciones.get(compra.funcion_id);
      if (!resumen) {
        continue;
      }

      const cantidadEntradas = butacas.filter(
        butaca => butaca.compra_id === compra.id
      ).length;

      if (compra.estado === 'confirmada') {
        resumen.comprasConfirmadas++;
        resumen.entradasConfirmadas += cantidadEntradas;
      }

      if (compra.estado === 'cancelada') {
        resumen.comprasCanceladas++;
        resumen.entradasCanceladas += cantidadEntradas;
      }
    }

    this.ventasPorFuncion.set(
      Array.from(resumenFunciones.values()).sort((a, b) =>
        new Date(b.inicio).getTime() -
        new Date(a.inicio).getTime())
    );

    // Productos de Candy Bar más vendidos.
    // Se excluyen los combos para no mezclarlos con productos individuales.
    const resumenProductos = new Map<string, any>();

    for (const item of items) {
      if (!item.producto_id || item.combo_id) {
        continue;
      }

      const compra = comprasPorId.get(item.compra_id);

      if (compra?.estado !== 'confirmada') {
        continue;
      }

      const nombre = item.nombre;
      const actual = resumenProductos.get(nombre) ?? {
        nombre,
        cantidad: 0,
        importe: 0
      };

      actual.cantidad += Number(item.cantidad || 0);
      actual.importe +=
        Number(item.cantidad || 0) *
        Number(item.precio_unitario || 0);
        resumenProductos.set(nombre, actual);
    }

    this.productosMasVendidos.set(
      Array.from(resumenProductos.values()).sort((a, b) => b.cantidad - a.cantidad)
    );

    // Películas con más compras cuyas entradas fueron validadas.
    // La validación se registra por compra, no por butaca individual.
    const resumenPeliculas = new Map<string, any>();

    for (const compra of compras) {
      if (
        compra.estado !== 'confirmada' ||
        !compra.entrada_validada_at
      ) {
        continue;
      }

      const funcion = funcionesPorId.get(compra.funcion_id);

      if (!funcion) {
        continue;
      }

      const pelicula = peliculasPorId.get(funcion.pelicula_id);

      if (!pelicula) {
        continue;
      }

      const actual = resumenPeliculas.get(pelicula.id) ?? {
        pelicula: pelicula.nombre,
        comprasValidadas: 0
      };

      actual.comprasValidadas++;
      resumenPeliculas.set(pelicula.id, actual);
    }

    this.peliculasMasVistas.set(
      Array.from(resumenPeliculas.values())
        .sort((a, b) => b.comprasValidadas - a.comprasValidadas)
    );

    this.cargandoReportes.set(false);
  }
}
