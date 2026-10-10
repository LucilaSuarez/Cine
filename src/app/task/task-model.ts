export interface Pelicula {
  id: string;
  nombre: string;
  sinopsis: string | null;
  duracion_min: number;
  poster_url: string | null;
  edad_minima: number;
  fecha_estreno: string;
  generos: string[];
}

export type RolUsuario = 'cliente' | 'empleado' | 'administrador';

export interface Perfil {
  id: string;
  email: string | null;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string | null;
  tipo_sangre: string | null;
  color_ojos: string | null;
  dias_vacaciones: number | null;
  avatar_url: string | null;
  rol: RolUsuario;
}

export interface DatosRegistro {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  fecha_nacimiento: string;
  tipo_sangre: string;
  color_ojos: string;
  dias_vacaciones: number;
}

export interface Producto {
  id: string;
  nombre: string;
  imagen_url: string | null;
  precio: number;
  categoria: string;
}

export interface Funcion {
  id: string;
  inicio: string;
  fin: string;
  formato: string;
  idioma: string;
  precio: number;
  sala: string;
}

export interface PeliculaConFunciones extends Pelicula {
  funciones: Funcion[];
}

export type TipoButaca = 'estandar' | 'accesible' | 'vip';
export type EstadoButaca = 'libre' | 'ocupada' | 'seleccionada';

export interface Butaca {
  id: string;
  fila: string;
  numero: number;
  sector: number;
  tipo: TipoButaca;
}

export interface ButacaOcupada {
  id: string;
  funcion_id: string;
  butaca_id: string;
}

export interface FuncionDetalle {
  id: string;
  inicio: string;
  formato: string;
  idioma: string;
  precio: number;
  sala_id: string;
  sala: string;
  pelicula: { id: string; nombre: string; edad_minima: number; poster_url: string | null };
}

export interface ItemCompra {
  producto: Producto;
  cantidad: number;
}

export interface PeliculaAsistida {
  pelicula: Pelicula;
  fechaFuncion: string;
}

export interface Comprobante {
  compra_id: string;
  qr_codigo: string;
  codigo_manual: string;
  estado: string;
  total: number;
  created_at: string;
  entrada_validada_at: string | null;
  candy_retirado_at: string | null;
  pelicula: string;
  edad_minima: number;
  inicio: string;
  formato: string;
  idioma: string;
  sala: string;
  butacas: string[];
  items: { nombre: string; cantidad: number }[];
  leyenda: string | null;
}

export interface Resenia {
  id: string;
  usuario_id: string;
  autor: string;
  puntuacion: number;
  comentario: string | null;
  created_at: string;
}

export interface ResumenPuntuacion {
  promedio: number | null;
  cantidad: number;
}