import {
  Component,
  signal
} from '@angular/core';

import {
  FormsModule
} from '@angular/forms';

import {
  CompraService
} from '../../core/services/compra';


@Component({
  selector: 'app-empleado',
  imports: [
    FormsModule
  ],
  templateUrl: './empleado.html',
  styleUrl: './empleado.css'
})
export class Empleado {

  codigo = '';


  compra =
    signal<any>(null);


  mensaje =
    signal('');


  constructor(
    private compraService:
      CompraService
  ) {}


  async buscar() {

    const codigoLimpio =
      this.codigo.trim();


    if (!codigoLimpio) {

      this.compra.set(
        null
      );


      this.mensaje.set(
        'Ingresá un código de compra.'
      );


      return;

    }


    const compra =
      await this.compraService
        .buscarCompraPorCodigo(
          codigoLimpio
        );


    if (!compra) {

      this.compra.set(
        null
      );


      this.mensaje.set(
        'Código inválido o compra inexistente.'
      );


      return;

    }


    this.compra.set(
      compra
    );


    this.mensaje.set('');

  }


  todasEntradasValidadas() {

    const compra =
      this.compra();


    if (
      !compra
      ||
      !compra.entradas
      ||
      compra.entradas.length === 0
    ) {

      return false;

    }


    return compra.entradas
      .every(
        (entrada: any) =>
          entrada.validada
      );

  }


  todoCandyEntregado() {

    const compra =
      this.compra();


    if (
      !compra
      ||
      !compra.compra_productos
      ||
      compra.compra_productos.length === 0
    ) {

      return false;

    }


    return compra.compra_productos
      .every(
        (producto: any) =>
          producto.entregado
      );

  }


  async validarEntrada() {

    const compra =
      this.compra();


    if (!compra) {

      return;

    }


    if (
      !compra.entradas
      ||
      compra.entradas.length === 0
    ) {

      this.mensaje.set(
        'Esta compra no tiene entradas.'
      );


      return;

    }


    if (
      this.todasEntradasValidadas()
    ) {

      this.mensaje.set(
        'Las entradas de este QR ya fueron utilizadas.'
      );


      return;

    }


    const {
      error
    } =
      await this.compraService
        .validarEntradas(
          compra.id
        );


    if (error) {

      console.error(
        error
      );


      this.mensaje.set(
        'No se pudieron validar las entradas.'
      );


      return;

    }


    this.mensaje.set(
      'Entrada validada correctamente.'
    );


    await this.buscar();

  }


  async entregarCandy() {

    const compra =
      this.compra();


    if (!compra) {

      return;

    }


    if (
      !compra.compra_productos
      ||
      compra.compra_productos.length === 0
    ) {

      this.mensaje.set(
        'Esta compra no tiene productos de Candy Bar.'
      );


      return;

    }


    if (
      this.todoCandyEntregado()
    ) {

      this.mensaje.set(
        'Los productos de Candy Bar ya fueron entregados.'
      );


      return;

    }


    const {
      error
    } =
      await this.compraService
        .entregarCandy(
          compra.id
        );


    if (error) {

      console.error(
        error
      );


      this.mensaje.set(
        'No se pudo registrar la entrega del Candy Bar.'
      );


      return;

    }


    this.mensaje.set(
      'Candy Bar entregado correctamente.'
    );


    await this.buscar();

  }


  limpiar() {

    this.codigo = '';


    this.compra.set(
      null
    );


    this.mensaje.set('');

  }

}