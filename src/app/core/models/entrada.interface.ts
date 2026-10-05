export interface Entrada {

  id?: number;

  compra_id?: number;

  funcion_id: number;

  codigo_butaca: string;

  tipo:
    | 'normal'
    | 'accesible'
    | 'vip';

  precio: number;

  validada?: boolean;

  created_at?: string;

}