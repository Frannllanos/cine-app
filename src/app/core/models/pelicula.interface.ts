export interface Pelicula {
  id?: number;

  nombre: string;
  sinopsis: string;
  duracion: number;

  imagen_url: string;

  generos: string[];

  restriccion_edad: number | null;

  en_cartelera: boolean;
  proximamente: boolean;

  fecha_estreno?: string;

  preventa_activa?: boolean;
  precio_preventa?: number | null;
}