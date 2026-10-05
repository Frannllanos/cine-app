import {
  Injectable
} from '@angular/core';

import {
  SupabaseService
} from './supabase';

import {
  Recompensa
} from '../models/recompensa.interface';

import {
  Canje
} from '../models/canje.interface';


@Injectable({
  providedIn: 'root'
})
export class FidelizacionService {

  constructor(
    private supabaseService:
      SupabaseService
  ) {}


  async obtenerRecompensas():
    Promise<Recompensa[]> {

    const {
      data,
      error
    } =
      await this.supabaseService.client
        .from('recompensas')
        .select(`
          *,
          productos (
            id,
            nombre,
            categoria,
            precio,
            imagen_url
          )
        `)
        .eq(
          'activo',
          true
        )
        .order(
          'costo_puntos'
        );


    if (error) {

      console.error(
        'Error obteniendo recompensas:',
        error
      );

      return [];

    }


    return data ?? [];

  }


  async obtenerTodasRecompensas():
    Promise<Recompensa[]> {

    const {
      data,
      error
    } =
      await this.supabaseService.client
        .from('recompensas')
        .select(`
          *,
          productos (
            id,
            nombre,
            categoria,
            precio,
            imagen_url
          )
        `)
        .order(
          'created_at',
          {
            ascending: false
          }
        );


    if (error) {

      console.error(
        'Error obteniendo recompensas:',
        error
      );

      return [];

    }


    return data ?? [];

  }


  async crearRecompensa(
    recompensa: Recompensa
  ) {

    return await this.supabaseService.client
      .from('recompensas')
      .insert(
        recompensa
      )
      .select()
      .single();

  }


  async cambiarEstado(
    recompensa: Recompensa
  ) {

    if (!recompensa.id) {

      return {
        error:
          new Error(
            'Recompensa inválida'
          )
      };

    }


    return await this.supabaseService.client
      .from('recompensas')
      .update({

        activo:
          !recompensa.activo

      })
      .eq(
        'id',
        recompensa.id
      )
      .select()
      .single();

  }


  async eliminarRecompensa(
    id: number
  ) {

    return await this.supabaseService.client
      .from('recompensas')
      .delete()
      .eq(
        'id',
        id
      );

  }


  async obtenerPuntos():
    Promise<number> {

    const {
      data: sesionData
    } =
      await this.supabaseService.client.auth
        .getSession();


    const usuario =
      sesionData.session?.user;


    if (!usuario) {

      return 0;

    }


    const {
      data,
      error
    } =
      await this.supabaseService.client
        .from('profiles')
        .select(
          'puntos'
        )
        .eq(
          'id',
          usuario.id
        )
        .single();


    if (error) {

      console.error(
        'Error obteniendo puntos:',
        error
      );

      return 0;

    }


    return Number(
      data.puntos
      ??
      0
    );

  }


  async canjear(
    recompensaId: number
  ) {

    return await this.supabaseService.client
      .rpc(
        'canjear_recompensa',
        {
          p_recompensa_id:
            recompensaId
        }
      );

  }


  async obtenerMisCanjes():
    Promise<Canje[]> {

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
      data: canjes,
      error
    } =
      await this.supabaseService.client
        .from('canjes')
        .select('*')
        .eq(
          'usuario_id',
          usuario.id
        )
        .order(
          'created_at',
          {
            ascending: false
          }
        );


    if (error) {

      console.error(
        'Error obteniendo canjes:',
        error
      );

      return [];

    }


    return await this
      .agregarRecompensasACanjes(
        canjes ?? []
      );

  }


  async obtenerCanjesDisponibles():
    Promise<Canje[]> {

    const {
      data: sesionData
    } =
      await this.supabaseService.client.auth
        .getSession();


    const usuario =
      sesionData.session?.user;


    if (!usuario) {

      console.log(
        'No hay usuario autenticado'
      );

      return [];

    }


    const {
      data: canjes,
      error
    } =
      await this.supabaseService.client
        .from('canjes')
        .select('*')
        .eq(
          'usuario_id',
          usuario.id
        )
        .eq(
          'estado',
          'disponible'
        )
        .order(
          'created_at',
          {
            ascending: false
          }
        );


    if (error) {

      console.error(
        'Error obteniendo canjes disponibles:',
        error
      );

      return [];

    }


    console.log(
      'Canjes disponibles encontrados:',
      canjes
    );


    const resultado =
      await this
        .agregarRecompensasACanjes(
          canjes ?? []
        );


    console.log(
      'Canjes disponibles completos:',
      resultado
    );


    return resultado;

  }


  private async agregarRecompensasACanjes(
    canjes: any[]
  ): Promise<Canje[]> {

    if (
      canjes.length === 0
    ) {

      return [];

    }


    const idsRecompensas =
      [
        ...new Set(
          canjes.map(
            canje =>
              Number(
                canje.recompensa_id
              )
          )
        )
      ];


    const {
      data: recompensas,
      error
    } =
      await this.supabaseService.client
        .from('recompensas')
        .select(`
          *,
          productos (
            id,
            nombre,
            categoria,
            precio,
            imagen_url
          )
        `)
        .in(
          'id',
          idsRecompensas
        );


    if (error) {

      console.error(
        'Error obteniendo recompensas de los canjes:',
        error
      );

      return [];

    }


    const mapaRecompensas =
      new Map<number, Recompensa>();


    for (
      const recompensa
      of recompensas ?? []
    ) {

      mapaRecompensas.set(
        Number(
          recompensa.id
        ),
        recompensa
      );

    }


    const resultado:
      Canje[] =
      canjes.map(
        canje => ({

          ...canje,

          recompensas:
            mapaRecompensas.get(
              Number(
                canje.recompensa_id
              )
            )

        })
      );


    return resultado;

  }

}