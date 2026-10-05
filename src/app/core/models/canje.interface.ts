import {
  Recompensa
} from './recompensa.interface';


export interface Canje {

  id?: number;

  usuario_id: string;

  recompensa_id: number;

  puntos_usados: number;

  estado:
    | 'disponible'
    | 'utilizado';

  created_at?: string;

  utilizado_at?:
    string | null;


  recompensas?:
    Recompensa;

}