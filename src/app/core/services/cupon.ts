import {
  Injectable
} from '@angular/core';

import {
  SupabaseService
} from './supabase';

import {
  Cupon
} from '../models/cupon.interface';


@Injectable({
  providedIn: 'root'
})
export class CuponService {

  constructor(
    private supabaseService:
      SupabaseService
  ) {}


  async obtenerCupones():
    Promise<Cupon[]> {

    const {
      data,
      error
    } =
      await this.supabaseService.client
        .from('cupones')
        .select('*')
        .order(
          'created_at',
          {
            ascending: false
          }
        );


    if (error) {

      console.error(error);

      return [];

    }


    return data ?? [];

  }


  async crearCupon(
    cupon: Cupon
  ) {

    return await this.supabaseService.client
      .from('cupones')
      .insert(cupon)
      .select()
      .single();

  }


  async actualizarCupon(
    id: number,
    cambios: Partial<Cupon>
  ) {

    return await this.supabaseService.client
      .from('cupones')
      .update(cambios)
      .eq('id', id)
      .select()
      .single();

  }


  async eliminarCupon(
    id: number
  ) {

    return await this.supabaseService.client
      .from('cupones')
      .delete()
      .eq('id', id);

  }


  async buscarPorCodigo(
    codigo: string
  ): Promise<Cupon | null> {

    const {
      data,
      error
    } =
      await this.supabaseService.client
        .from('cupones')
        .select('*')
        .eq(
          'codigo',
          codigo
            .trim()
            .toUpperCase()
        )
        .eq(
          'activo',
          true
        )
        .maybeSingle();


    if (error) {

      console.error(error);

      return null;

    }


    return data;

  }


  async obtenerCuponPrimeraCompraDisponible():
    Promise<Cupon | null> {

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
      count,
      error: errorCompras
    } =
      await this.supabaseService.client
        .from('compras')
        .select(
          'id',
          {
            count: 'exact',
            head: true
          }
        )
        .eq(
          'usuario_id',
          usuario.id
        );


    if (errorCompras) {

      console.error(
        errorCompras
      );

      return null;

    }


    if (
      (count ?? 0) > 0
    ) {

      return null;

    }


    const {
      data,
      error
    } =
      await this.supabaseService.client
        .from('cupones')
        .select('*')
        .eq(
          'tipo',
          'primera_compra'
        )
        .eq(
          'activo',
          true
        )
        .limit(1)
        .maybeSingle();


    if (error) {

      console.error(error);

      return null;

    }


    return data;

  }


  async validarCuponParaUsuario(
    codigo: string
  ): Promise<{
    valido: boolean;
    cupon: Cupon | null;
    mensaje: string;
  }> {

    const {
      data: sesionData
    } =
      await this.supabaseService.client.auth
        .getSession();


    const usuario =
      sesionData.session?.user;


    if (!usuario) {

      return {
        valido: false,
        cupon: null,
        mensaje:
          'Tenés que iniciar sesión para usar cupones.'
      };

    }


    const cupon =
      await this.buscarPorCodigo(
        codigo
      );


    if (!cupon) {

      return {
        valido: false,
        cupon: null,
        mensaje:
          'El cupón no existe o está inactivo.'
      };

    }


    if (
      cupon.tipo
      ===
      'primera_compra'
    ) {

      const {
        count,
        error
      } =
        await this.supabaseService.client
          .from('compras')
          .select(
            'id',
            {
              count: 'exact',
              head: true
            }
          )
          .eq(
            'usuario_id',
            usuario.id
          );


      if (error) {

        console.error(error);

        return {
          valido: false,
          cupon: null,
          mensaje:
            'No se pudo validar el cupón.'
        };

      }


      if (
        (count ?? 0) > 0
      ) {

        return {
          valido: false,
          cupon: null,
          mensaje:
            'Este cupón solo sirve para la primera compra.'
        };

      }

    }


    if (
      cupon.tipo
      ===
      'mayores_50'
    ) {

      const {
        data: perfil,
        error
      } =
        await this.supabaseService.client
          .from('profiles')
          .select(
            'fecha_nacimiento'
          )
          .eq(
            'id',
            usuario.id
          )
          .single();


      if (
        error
        ||
        !perfil?.fecha_nacimiento
      ) {

        return {
          valido: false,
          cupon: null,
          mensaje:
            'Tu perfil no tiene una fecha de nacimiento válida.'
        };

      }


      const edad =
        this.calcularEdad(
          perfil.fecha_nacimiento
        );


      if (
        edad <= 50
      ) {

        return {
          valido: false,
          cupon: null,
          mensaje:
            'Este cupón es exclusivo para usuarios mayores de 50 años.'
        };

      }

    }


    return {
      valido: true,
      cupon,
      mensaje:
        `Cupón aplicado: ${cupon.porcentaje}% de descuento.`
    };

  }


  private calcularEdad(
    fechaNacimiento: string
  ) {

    const hoy =
      new Date();


    const nacimiento =
      new Date(
        `${fechaNacimiento}T00:00:00`
      );


    let edad =
      hoy.getFullYear()
      -
      nacimiento.getFullYear();


    const diferenciaMes =
      hoy.getMonth()
      -
      nacimiento.getMonth();


    if (
      diferenciaMes < 0
      ||
      (
        diferenciaMes === 0
        &&
        hoy.getDate()
        <
        nacimiento.getDate()
      )
    ) {

      edad--;

    }


    return edad;

  }

}