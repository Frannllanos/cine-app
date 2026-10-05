import {
  Injectable
} from '@angular/core';

import {
  SupabaseService
} from './supabase';

import {
  Resena
} from '../models/resena.interface';


@Injectable({
  providedIn: 'root'
})
export class ResenaService {

  constructor(
    private supabaseService:
      SupabaseService
  ) {}


  async obtenerResenasPorPelicula(
    peliculaId: number
  ): Promise<Resena[]> {

    const {
      data,
      error
    } =
      await this.supabaseService.client
        .from('resenas')
        .select('*')
        .eq(
          'pelicula_id',
          peliculaId
        )
        .order(
          'created_at',
          {
            ascending: false
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


  async obtenerMiResena(
    peliculaId: number
  ): Promise<Resena | null> {

    const {
      data: sesionData
    } =
      await this.supabaseService.client.auth
        .getSession();


    const usuario =
      sesionData.session?.user;


    if (!usuario) {

      return null;

    }


    const {
      data,
      error
    } =
      await this.supabaseService.client
        .from('resenas')
        .select('*')
        .eq(
          'pelicula_id',
          peliculaId
        )
        .eq(
          'usuario_id',
          usuario.id
        )
        .maybeSingle();


    if (error) {

      console.error(
        error
      );

      return null;

    }


    return data;

  }


  async guardarResena(

    peliculaId: number,

    puntuacion: number,

    comentario: string

  ) {

    const {
      data: sesionData
    } =
      await this.supabaseService.client.auth
        .getSession();


    const usuario =
      sesionData.session?.user;


    if (!usuario) {

      return {

        data: null,

        error:
          new Error(
            'Tenés que iniciar sesión para dejar una reseña.'
          )

      };

    }


    return await this.supabaseService.client
      .from('resenas')
      .upsert(
        {

          usuario_id:
            usuario.id,

          pelicula_id:
            peliculaId,

          puntuacion,

          comentario:
            comentario
              .trim(),

          updated_at:
            new Date()
              .toISOString()

        },
        {
          onConflict:
            'usuario_id,pelicula_id'
        }
      )
      .select()
      .single();

  }

}