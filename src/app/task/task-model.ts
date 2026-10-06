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