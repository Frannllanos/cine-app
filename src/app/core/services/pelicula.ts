import {
  Injectable
} from '@angular/core';

import {
  SupabaseService
} from './supabase';

import {
  Pelicula
} from '../models/pelicula.interface';


interface RankingPelicula {

  pelicula_id: number;

  ventas: number;

}


interface PeliculaConVentas
  extends Pelicula {

  ventas: number;

}


@Injectable({
  providedIn: 'root'
})
export class PeliculaService {

  constructor(
    private supabaseService:
      SupabaseService
  ) {}


  async obtenerPeliculas():
    Promise<Pelicula[]> {

    const {
      data,
      error
    } =
      await this.supabaseService.client
        .from('peliculas')
        .select('*')
        .order(
          'nombre',
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


    return (
      data
      ??
      []
    ) as Pelicula[];

  }


  async obtenerPeliculasCartelera():
    Promise<Pelicula[]> {

    const {
      data,
      error
    } =
      await this.supabaseService.client
        .from('peliculas')
        .select('*')
        .eq(
          'en_cartelera',
          true
        )
        .order(
          'nombre',
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


    return (
      data
      ??
      []
    ) as Pelicula[];

  }


  async obtenerPelicula(
    id: number
  ): Promise<Pelicula | null> {

    const {
      data,
      error
    } =
      await this.supabaseService.client
        .from('peliculas')
        .select('*')
        .eq(
          'id',
          id
        )
        .single();


    if (error) {

      console.error(
        error
      );

      return null;

    }


    return data as Pelicula;

  }


  async obtenerTopVendidas():
    Promise<PeliculaConVentas[]> {

    const {
      data: dataRanking,
      error
    } =
      await this.supabaseService.client
        .rpc(
          'peliculas_mas_vendidas'
        );


    if (error) {

      console.error(
        error
      );


      const respaldo =
        await this
          .obtenerPeliculasCartelera();


      return respaldo
        .slice(
          0,
          3
        )
        .map(
          (
            pelicula:
              Pelicula
          ) => ({

            ...pelicula,

            ventas: 0

          })
        );

    }


    const ranking:
      RankingPelicula[] =
      (
        dataRanking
        ??
        []
      ) as RankingPelicula[];


    if (
      ranking.length === 0
    ) {

      const respaldo =
        await this
          .obtenerPeliculasCartelera();


      return respaldo
        .slice(
          0,
          3
        )
        .map(
          (
            pelicula:
              Pelicula
          ) => ({

            ...pelicula,

            ventas: 0

          })
        );

    }


    const ids:
      number[] =
      ranking.map(
        (
          item:
            RankingPelicula
        ) =>
          Number(
            item.pelicula_id
          )
      );


    const {
      data: dataPeliculas,
      error: errorPeliculas
    } =
      await this.supabaseService.client
        .from('peliculas')
        .select('*')
        .in(
          'id',
          ids
        );


    if (
      errorPeliculas
      ||
      !dataPeliculas
    ) {

      console.error(
        errorPeliculas
      );

      return [];

    }


    const peliculas:
      Pelicula[] =
      (
        dataPeliculas
        ??
        []
      ) as unknown as Pelicula[];


    const mapaPeliculas =
      new Map<
        number,
        Pelicula
      >();


    for (
      const pelicula
      of peliculas
    ) {

      if (
        pelicula.id
        !==
        undefined
      ) {

        mapaPeliculas.set(
          Number(
            pelicula.id
          ),
          pelicula
        );

      }

    }


    const resultado:
      PeliculaConVentas[] =
      [];


    for (
      const item
      of ranking
    ) {

      const pelicula =
        mapaPeliculas.get(
          Number(
            item.pelicula_id
          )
        );


      if (!pelicula) {

        continue;

      }


      resultado.push({

        ...pelicula,

        ventas:
          Number(
            item.ventas
          )

      });

    }


    return resultado;

  }


  async crearPelicula(
    pelicula: Pelicula
  ) {

    return await this.supabaseService.client
      .from('peliculas')
      .insert(
        pelicula
      )
      .select()
      .single();

  }


  async actualizarPelicula(

    id: number,

    cambios:
      Partial<Pelicula>

  ) {

    return await this.supabaseService.client
      .from('peliculas')
      .update(
        cambios
      )
      .eq(
        'id',
        id
      )
      .select()
      .single();

  }


  async eliminarPelicula(
    id: number
  ) {

    return await this.supabaseService.client
      .from('peliculas')
      .delete()
      .eq(
        'id',
        id
      );

  }


  async subirImagen(
    archivo: File
  ): Promise<string | null> {

    const extension =
      archivo.name
        .split('.')
        .pop()
      ??
      'jpg';


    const nombre =
      `${crypto.randomUUID()}.${extension}`;


    const {
      error
    } =
      await this.supabaseService.client
        .storage
        .from('peliculas')
        .upload(
          nombre,
          archivo
        );


    if (error) {

      console.error(
        error
      );

      return null;

    }


    const {
      data
    } =
      this.supabaseService.client
        .storage
        .from('peliculas')
        .getPublicUrl(
          nombre
        );


    return data.publicUrl;

  }

}