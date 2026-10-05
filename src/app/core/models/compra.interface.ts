export interface Compra {

  id?: number;

  usuario_id?: string | null;

  total: number;

  estado:
    | 'pendiente'
    | 'pagada'
    | 'cancelada';

  codigo_qr?: string;

  created_at?: string;

}