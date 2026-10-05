export interface Combo {

  id?: number;

  nombre: string;

  pochoclo_id: number;

  bebida_id: number;

  precio: number;

  activo: boolean;

  pochoclo?: {
    id: number;
    nombre: string;
    precio: number;
    imagen_url: string;
  };

  bebida?: {
    id: number;
    nombre: string;
    precio: number;
    imagen_url: string;
  };

}