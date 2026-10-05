export interface Producto {
  id?: number;

  nombre: string;
  categoria: string;

  precio: number;

  imagen_url: string;

  activo: boolean;
}