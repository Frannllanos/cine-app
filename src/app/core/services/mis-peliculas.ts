import {
  Injectable
} from '@angular/core';

import {
  SupabaseService
} from './supabase';


export interface PeliculaVista {

  pelicula_id: number;

  funcion_id: number;

  nombre: string;

  imagen_url: string;

  fecha_hora: string;

  formato: string;

  idioma: string;

  puntuacion:
    number | null;

}


@Injectable({
  providedIn: 'root'
})
export class MisPeliculasService {

  constructor(
    private supabaseService:
      SupabaseService
  ) {}


  async obtenerMisPeliculas():
    Promise<PeliculaVista[]> {

    const {
      data: sesionData
    } =
      await this.supabaseService.client.auth
        .getSession();


    const usuario =
      sesionData.session?.user;


    if (!usuario) {

      return [];

    }


    /*
     * Buscamos solamente entradas
     * que realmente fueron validadas.
     */
    const {
      data: entradasData,
      error: entradasError
    } =
      await this.supabaseService.client
        .from('entradas')
        .select(`
          id,
          funcion_id,
          validada,

          compras!inner (
            id,
            usuario_id,
            estado
          ),

          funciones!inner (
            id,
            fecha_hora,
            formato,
            idioma,

            peliculas!inner (
              id,
              nombre,
              imagen_url
            )
          )
        `)
        .eq(
          'validada',
          true
        )
        .eq(
          'compras.usuario_id',
          usuario.id
        )
        .eq(
          'compras.estado',
          'pagada'
        )
        .order(
          'id',
          {
            ascending: false
          }
        );


    if (
      entradasError
      ||
      !entradasData
    ) {

      console.error(
        entradasError
      );

      return [];

    }


    /*
     * Evitamos repetir la misma película
     * si el usuario compró varias butacas
     * para una misma función.
     */
    const vistasPorFuncion =
      new Map<
        number,
        PeliculaVista
      >();


    for (
      const entrada
      of entradasData as any[]
    ) {

      const funcion =
        entrada.funciones;


      const pelicula =
        funcion?.peliculas;


      if (
        !funcion
        ||
        !pelicula
      ) {

        continue;

      }


      const funcionId =
        Number(
          funcion.id
        );


      if (
        vistasPorFuncion.has(
          funcionId
        )
      ) {

        continue;

      }


      vistasPorFuncion.set(
        funcionId,
        {

          pelicula_id:
            Number(
              pelicula.id
            ),

          funcion_id:
            funcionId,

          nombre:
            pelicula.nombre,

          imagen_url:
            pelicula.imagen_url,

          fecha_hora:
            funcion.fecha_hora,

          formato:
            funcion.formato,

          idioma:
            funcion.idioma,

          puntuacion:
            null

        }
      );

    }


    const peliculas =
      Array.from(
        vistasPorFuncion.values()
      );


    if (
      peliculas.length === 0
    ) {

      return [];

    }


    /*
     * Traemos solamente las reseñas
     * del usuario actual.
     */
    const idsPeliculas =
      [
        ...new Set(
          peliculas.map(
            item =>
              item.pelicula_id
          )
        )
      ];


    const {
      data: resenasData,
      error: resenasError
    } =
      await this.supabaseService.client
        .from('resenas')
        .select(
          'pelicula_id, puntuacion'
        )
        .eq(
          'usuario_id',
          usuario.id
        )
        .in(
          'pelicula_id',
          idsPeliculas
        );


    if (resenasError) {

      console.error(
        resenasError
      );

    }


    const mapaPuntuaciones =
      new Map<
        number,
        number
      >();


    for (
      const resena
      of resenasData
      ??
      []
    ) {

      mapaPuntuaciones.set(

        Number(
          resena.pelicula_id
        ),

        Number(
          resena.puntuacion
        )

      );

    }


    return peliculas
      .map(
        pelicula => ({

          ...pelicula,

          puntuacion:
            mapaPuntuaciones.get(
              pelicula.pelicula_id
            )
            ??
            null

        })
      )
      .sort(
        (
          a,
          b
        ) =>

          new Date(
            b.fecha_hora
          ).getTime()
          -
          new Date(
            a.fecha_hora
          ).getTime()

      );

  }

}