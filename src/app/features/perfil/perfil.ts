import {
  Component,
  OnInit,
  signal
} from '@angular/core';

import {
  DatePipe
} from '@angular/common';

import {
  AuthService
} from '../../core/services/auth';

import {
  CompraService
} from '../../core/services/compra';

import {
  FidelizacionService
} from '../../core/services/fidelizacion';

import {
  CancelacionService
} from '../../core/services/cancelacion';

import {
  Recompensa
} from '../../core/models/recompensa.interface';

import {
  Canje
} from '../../core/models/canje.interface';


@Component({
  selector: 'app-perfil',

  imports: [
    DatePipe
  ],

  templateUrl:
    './perfil.html',

  styleUrl:
    './perfil.css'
})
export class Perfil
  implements OnInit {

  perfil =
    signal<any>(null);


  compras =
    signal<any[]>([]);


  recompensas =
    signal<Recompensa[]>([]);


  canjes =
    signal<Canje[]>([]);


  puntos =
    signal(0);


  mensaje =
    signal('');


  canjeandoId =
    signal<number | null>(
      null
    );


  cancelandoId =
    signal<number | null>(
      null
    );


  constructor(

    private authService:
      AuthService,

    private compraService:
      CompraService,

    private fidelizacionService:
      FidelizacionService,

    private cancelacionService:
      CancelacionService

  ) {}


  async ngOnInit() {

    await this
      .cargarTodo();

  }


  async cargarTodo() {

    const perfil =
      await this.authService
        .obtenerPerfil();


    this.perfil.set(
      perfil
    );


    this.puntos.set(
      await this.fidelizacionService
        .obtenerPuntos()
    );


    this.recompensas.set(
      await this.fidelizacionService
        .obtenerRecompensas()
    );


    this.canjes.set(
      await this.fidelizacionService
        .obtenerMisCanjes()
    );


    this.compras.set(
      await this.compraService
        .obtenerMisCompras()
    );

  }


  creditoDisponible() {

    return Number(
      this.perfil()?.credito
      ??
      0
    );

  }


  creditoGenerado(
    compra: any
  ) {

    return Number(
      compra?.credito_generado
      ??
      compra?.total
      ??
      0
    );

  }


  puedeCanjear(
    recompensa: Recompensa
  ) {

    return (
      this.puntos()
      >=
      Number(
        recompensa.costo_puntos
      )
    );

  }


  async canjear(
    recompensa: Recompensa
  ) {

    if (
      !recompensa.id
    ) {

      return;

    }


    if (
      !this.puedeCanjear(
        recompensa
      )
    ) {

      this.mensaje.set(
        'No tenés suficientes puntos para esta recompensa.'
      );

      return;

    }


    this.canjeandoId.set(
      recompensa.id
    );


    this.mensaje.set('');


    const {
      error
    } =
      await this.fidelizacionService
        .canjear(
          recompensa.id
        );


    this.canjeandoId.set(
      null
    );


    if (error) {

      console.error(
        error
      );


      this.mensaje.set(
        error.message
        ||
        'No se pudo realizar el canje.'
      );

      return;

    }


    this.mensaje.set(
      `Canjeaste "${recompensa.nombre}" correctamente.`
    );


    await this
      .cargarTodo();

  }


  async cancelarCompra(
    compra: any
  ) {

    if (
      !compra?.id
      ||
      compra.estado
      !==
      'pagada'
    ) {

      return;

    }


    const confirmar =
      window.confirm(
        '¿Querés cancelar esta compra? El dinero no se devuelve: el importe se acreditará en tu cuenta.'
      );


    if (!confirmar) {

      return;

    }


    this.cancelandoId.set(
      compra.id
    );


    this.mensaje.set('');


    const {
      data,
      error
    } =
      await this.cancelacionService
        .cancelarCompra(
          compra.id
        );


    this.cancelandoId.set(
      null
    );


    if (error) {

      console.error(
        error
      );


      this.mensaje.set(
        error.message
        ||
        'No se pudo cancelar la compra.'
      );

      return;

    }


    const credito =
      Number(
        data
        ??
        0
      );


    this.mensaje.set(
      `Compra cancelada. Se acreditaron $${credito.toFixed(2)} en tu cuenta.`
    );


    await this
      .cargarTodo();

  }


  estadoCanje(
    canje: Canje
  ) {

    if (
      canje.estado
      ===
      'utilizado'
    ) {

      return 'UTILIZADO';

    }


    return 'DISPONIBLE';

  }

}