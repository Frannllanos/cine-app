import {
  Injectable
} from '@angular/core';

import {
  SupabaseService
} from './supabase';


@Injectable({
  providedIn: 'root'
})
export class CancelacionService {

  constructor(
    private supabaseService:
      SupabaseService
  ) {}


  async cancelarCompra(
    compraId: number
  ) {

    return await this.supabaseService.client
      .rpc(
        'cancelar_compra',
        {
          p_compra_id:
            compraId
        }
      );

  }

}