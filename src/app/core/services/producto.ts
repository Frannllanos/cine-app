import { Injectable } from '@angular/core';

import { SupabaseService } from './supabase';

import { Producto } from '../models/producto.interface';


@Injectable({
  providedIn: 'root'
})
export class ProductoService {

  constructor(
    private supabaseService: SupabaseService
  ) {}


  async obtenerProductos(): Promise<Producto[]> {

    const { data, error } =
      await this.supabaseService.client
        .from('productos')
        .select('*')
        .eq('activo', true)
        .order('nombre');


    if (error) {

      console.error(error);

      return [];

    }


    return data ?? [];
  }


  async crearProducto(
    producto: Producto
  ) {

    return await this.supabaseService.client
      .from('productos')
      .insert(producto)
      .select()
      .single();

  }


  async eliminarProducto(
    id: number
  ) {

    return await this.supabaseService.client
      .from('productos')
      .delete()
      .eq('id', id);

  }


  async subirImagen(
    archivo: File
  ): Promise<string | null> {

    const nombreArchivo =
      `${Date.now()}-${archivo.name}`;


    const { error } =
      await this.supabaseService.client.storage
        .from('productos')
        .upload(
          nombreArchivo,
          archivo
        );


    if (error) {

      console.error(error);

      return null;

    }


    const { data } =
      this.supabaseService.client.storage
        .from('productos')
        .getPublicUrl(
          nombreArchivo
        );


    return data.publicUrl;
  }

}