export interface Funcion {
  id?: number;

  pelicula_id: number;
  sala_id: number;

  fecha_hora: string;

  formato: '2D' | '3D' | '4D' | '5D';

  idioma: 'Castellano' | 'Subtitulada';

  precio: number;
}