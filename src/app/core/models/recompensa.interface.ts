import {
  Producto
} from './producto.interface';


export interface Recompensa {

  id?: number;

  nombre: string;

  tipo:
    | 'entrada'
    | 'producto';

  producto_id?:
    number | null;

  costo_puntos: number;

  activo: boolean;

  created_at?: string;


  productos?:
    Producto | null;

}