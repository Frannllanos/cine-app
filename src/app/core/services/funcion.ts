import {
  Injectable
} from '@angular/core';

import {
  SupabaseService
} from './supabase';

import {
  Funcion
} from '../models/funcion.interface';


@Injectable({
  providedIn: 'root'
})
export class FuncionService {

  constructor(
    private supabaseService:
      SupabaseService
  ) {}


  async obtenerFunciones():
    Promise<any[]> {

    const {
      data,
      error
    } =
      await this.supabaseService.client
        .from('funciones')
        .select(`
          *,
          peliculas (
            id,
            nombre,
            duracion
          ),
          salas (
            id,
            nombre
          )
        `)
        .order(
          'fecha_hora',
          {
            ascending: true
          }
        );


    if (error) {

      console.error(
        error
      );

      return [];

    }


    return data ?? [];

  }


  async obtenerFuncionesPorPelicula(
    peliculaId: number
  ): Promise<Funcion[]> {

    const {
      data,
      error
    } =
      await this.supabaseService.client
        .from('funciones')
        .select(`
          *,
          peliculas (
            fecha_estreno,
            preventa_activa,
            precio_preventa,
            proximamente,
            en_cartelera
          )
        `)
        .eq(
          'pelicula_id',
          peliculaId
        )
        .gte(
          'fecha_hora',
          new Date().toISOString()
        )
        .order(
          'fecha_hora',
          {
            ascending: true
          }
        );


    if (error) {

      console.error(
        error
      );

      return [];

    }


    const funciones =
      (data ?? []) as any[];


    /*
     * Si la película todavía es "Próximamente"
     * y no entró en preventa, no mostramos
     * funciones para comprar.
     */
    const disponibles =
      funciones.filter(
        funcion => {

          const pelicula =
            funcion.peliculas;


          if (!pelicula) {

            return true;

          }


          if (
            pelicula.en_cartelera
            ===
            true
          ) {

            return true;

          }


          if (
            pelicula.proximamente
            ===
            true
          ) {

            return this.estaEnPreventa(
              pelicula
            );

          }


          return true;

        }
      );


    return disponibles.map(
      funcion => {

        const precioActual =
          this.obtenerPrecioActual(
            Number(
              funcion.precio
            ),
            funcion.peliculas
          );


        const {
          peliculas,
          ...funcionLimpia
        } =
          funcion;


        return {

          ...funcionLimpia,

          precio:
            precioActual

        } as Funcion;

      }
    );

  }


  async obtenerFuncion(
    id: number
  ): Promise<Funcion | null> {

    const {
      data,
      error
    } =
      await this.supabaseService.client
        .from('funciones')
        .select(`
          *,
          peliculas (
            fecha_estreno,
            preventa_activa,
            precio_preventa,
            proximamente,
            en_cartelera
          )
        `)
        .eq(
          'id',
          id
        )
        .single();


    if (
      error
      ||
      !data
    ) {

      console.error(
        error
      );

      return null;

    }


    const funcion =
      data as any;


    const pelicula =
      funcion.peliculas;


    /*
     * Evitamos entrar manualmente
     * a /compra?funcion=X antes de
     * que comience la preventa.
     */
    if (
      pelicula?.proximamente
      ===
      true
      &&
      pelicula?.en_cartelera
      !==
      true
      &&
      !this.estaEnPreventa(
        pelicula
      )
    ) {

      return null;

    }


    const precioActual =
      this.obtenerPrecioActual(
        Number(
          funcion.precio
        ),
        pelicula
      );


    const {
      peliculas,
      ...funcionLimpia
    } =
      funcion;


    return {

      ...funcionLimpia,

      precio:
        precioActual

    } as Funcion;

  }


  async crearFuncion(
    funcion: Funcion
  ) {

    return await this.supabaseService.client
      .from('funciones')
      .insert(
        funcion
      )
      .select()
      .single();

  }


  async crearFuncionAutomatica(

    peliculaId: number,

    fechaHora: string,

    formato: string,

    idioma: string,

    precio: number

  ) {

    return await this.supabaseService.client
      .rpc(
        'crear_funcion_automatica',
        {

          p_pelicula_id:
            peliculaId,

          p_fecha_hora:
            fechaHora,

          p_formato:
            formato,

          p_idioma:
            idioma,

          p_precio:
            precio

        }
      );

  }


  async eliminarFuncion(
    id: number
  ) {

    return await this.supabaseService.client
      .rpc(
        'eliminar_funcion_admin',
        {
          p_funcion_id:
            id
        }
      );

  }


  private obtenerPrecioActual(
    precioNormal: number,
    pelicula: any
  ) {

    if (
      this.estaEnPreventa(
        pelicula
      )
    ) {

      return Number(
        pelicula.precio_preventa
      );

    }


    return precioNormal;

  }


  private estaEnPreventa(
    pelicula: any
  ) {

    if (
      !pelicula?.preventa_activa
      ||
      !pelicula?.fecha_estreno
      ||
      Number(
        pelicula?.precio_preventa
        ??
        0
      )
      <=
      0
    ) {

      return false;

    }


    const ahora =
      new Date();


    const estreno =
      new Date(
        `${pelicula.fecha_estreno}T00:00:00`
      );


    const inicioPreventa =
      new Date(
        estreno
      );


    inicioPreventa.setDate(
      inicioPreventa.getDate()
      -
      7
    );


    return (
      ahora >= inicioPreventa
      &&
      ahora < estreno
    );

  }

}