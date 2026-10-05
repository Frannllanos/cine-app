import {
  Injectable
} from '@angular/core';

import {
  SupabaseService
} from './supabase';

import {
  Pelicula
} from '../models/pelicula.interface';


@Injectable({
  providedIn: 'root'
})
export class ProximamenteService {

  constructor(
    private supabaseService:
      SupabaseService
  ) {}


  async obtenerProximamente():
    Promise<Pelicula[]> {

    const {
      data,
      error
    } =
      await this.supabaseService.client
        .from('peliculas')
        .select('*')
        .eq(
          'proximamente',
          true
        )
        .order(
          'fecha_estreno',
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
    ) as unknown as Pelicula[];

  }


  async obtenerIdsAlertas():
    Promise<number[]> {

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


    const {
      data,
      error
    } =
      await this.supabaseService.client
        .from('alertas_peliculas')
        .select(
          'pelicula_id'
        )
        .eq(
          'usuario_id',
          usuario.id
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
    ).map(
      alerta =>
        Number(
          alerta.pelicula_id
        )
    );

  }


  async activarAlerta(
    peliculaId: number
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

        error:
          new Error(
            'Tenés que iniciar sesión para activar una alerta.'
          )

      };

    }


    return await this.supabaseService.client
      .from('alertas_peliculas')
      .upsert(
        {

          usuario_id:
            usuario.id,

          pelicula_id:
            peliculaId,

          notificada:
            false

        },
        {
          onConflict:
            'usuario_id,pelicula_id'
        }
      );

  }


  async desactivarAlerta(
    peliculaId: number
  ) {

    const {
      data: sesionData
    } =
      await this.supabaseService.client.auth
        .getSession();


    const usuario =
      sesionData.session?.user;


    if (!usuario) {

      return;

    }


    await this.supabaseService.client
      .from('alertas_peliculas')
      .delete()
      .eq(
        'usuario_id',
        usuario.id
      )
      .eq(
        'pelicula_id',
        peliculaId
      );

  }


  async solicitarPermisoNotificaciones() {

    if (
      !(
        'Notification'
        in
        window
      )
    ) {

      return;

    }


    if (
      Notification.permission
      ===
      'default'
    ) {

      await Notification
        .requestPermission();

    }

  }


  async verificarNotificaciones() {

    const {
      data: sesionData
    } =
      await this.supabaseService.client.auth
        .getSession();


    const usuario =
      sesionData.session?.user;


    if (!usuario) {

      return;

    }


    const {
      data: alertas,
      error
    } =
      await this.supabaseService.client
        .from('alertas_peliculas')
        .select(`
          id,
          notificada,
          pelicula_id,
          peliculas (
            id,
            nombre,
            fecha_estreno,
            preventa_activa,
            precio_preventa,
            en_cartelera
          )
        `)
        .eq(
          'usuario_id',
          usuario.id
        )
        .eq(
          'notificada',
          false
        );


    if (
      error
      ||
      !alertas
    ) {

      return;

    }


    for (
      const alerta
      of alertas as any[]
    ) {

      const pelicula =
        alerta.peliculas;


      if (!pelicula) {

        continue;

      }


      const disponible =
        pelicula.en_cartelera
        ||
        this.estaEnPreventa(
          pelicula
        );


      if (!disponible) {

        continue;

      }


      if (
        'Notification'
        in
        window
        &&
        Notification.permission
        ===
        'granted'
      ) {

        new Notification(
          '🎬 Entradas disponibles',
          {

            body:
              `Ya podés comprar entradas para ${pelicula.nombre}.`

          }
        );

      }


      await this.supabaseService.client
        .from('alertas_peliculas')
        .update({

          notificada:
            true

        })
        .eq(
          'id',
          alerta.id
        );

    }

  }


  estaEnPreventa(
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