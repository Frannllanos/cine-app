export interface Cupon {

  id?: number;

  nombre: string;

  codigo: string;

  porcentaje: number;

  tipo:
    | 'primera_compra'
    | 'mayores_50';

  activo: boolean;

  created_at?: string;

}