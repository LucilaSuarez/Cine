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