import {
  Injectable
} from '@angular/core';

import {
  SupabaseService
} from './supabase';

import {
  Combo
} from '../models/combo.interface';


@Injectable({
  providedIn: 'root'
})
export class ComboService {

  constructor(
    private supabaseService:
      SupabaseService
  ) {}


  async obtenerCombos():
    Promise<Combo[]> {

    const {
      data,
      error
    } =
      await this.supabaseService.client
        .from('combos')
        .select(`
          *,
          pochoclo:productos!combos_pochoclo_id_fkey (
            id,
            nombre,
            precio,
            imagen_url
          ),
          bebida:productos!combos_bebida_id_fkey (
            id,
            nombre,
            precio,
            imagen_url
          )
        `)
        .eq(
          'activo',
          true
        )
        .order(
          'nombre'
        );


    if (error) {

      console.error(
        error
      );

      return [];

    }


    return data ?? [];

  }


  async crearCombo(
    combo: Combo
  ) {

    return await this.supabaseService.client
      .from('combos')
      .insert(
        combo
      )
      .select()
      .single();

  }


  async eliminarCombo(
    id: number
  ) {

    return await this.supabaseService.client
      .from('combos')
      .delete()
      .eq(
        'id',
        id
      );

  }

}