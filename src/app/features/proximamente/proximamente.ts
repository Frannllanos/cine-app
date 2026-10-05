import {
  Component,
  OnInit,
  signal
} from '@angular/core';

import {
  DatePipe
} from '@angular/common';

import {
  RouterLink
} from '@angular/router';

import {
  ProximamenteService
} from '../../core/services/proximamente';

import {
  AuthService
} from '../../core/services/auth';

import {
  Pelicula
} from '../../core/models/pelicula.interface';


@Component({
  selector:
    'app-proximamente',

  imports: [
    DatePipe,
    RouterLink
  ],

  templateUrl:
    './proximamente.html',

  styleUrl:
    './proximamente.css'
})
export class Proximamente
  implements OnInit {

  peliculas =
    signal<Pelicula[]>([]);


  alertas =
    signal<Set<number>>(
      new Set()
    );


  logueado =
    signal(false);


  mensaje =
    signal('');


  constructor(

    private proximamenteService:
      ProximamenteService,

    private authService:
      AuthService

  ) {}


  async ngOnInit() {

    this.peliculas.set(
      await this.proximamenteService
        .obtenerProximamente()
    );


    const sesion =
      await this.authService
        .obtenerSesion();


    this.logueado.set(
      !!sesion
    );


    if (sesion) {

      const ids =
        await this.proximamenteService
          .obtenerIdsAlertas();


      this.alertas.set(
        new Set(
          ids
        )
      );


      await this.proximamenteService
        .verificarNotificaciones();

    }

  }


  estaEnPreventa(
    pelicula: Pelicula
  ) {

    return this.proximamenteService
      .estaEnPreventa(
        pelicula
      );

  }


  diasParaEstreno(
    pelicula: Pelicula
  ) {

    if (
      !pelicula.fecha_estreno
    ) {

      return 0;

    }


    const hoy =
      new Date();


    hoy.setHours(
      0,
      0,
      0,
      0
    );


    const estreno =
      new Date(
        `${pelicula.fecha_estreno}T00:00:00`
      );


    const diferencia =
      estreno.getTime()
      -
      hoy.getTime();


    return Math.max(
      0,

      Math.ceil(
        diferencia
        /
        (
          1000
          *
          60
          *
          60
          *
          24
        )
      )
    );

  }


  alertaActiva(
    peliculaId?: number
  ) {

    if (!peliculaId) {

      return false;

    }


    return this.alertas()
      .has(
        peliculaId
      );

  }


  async alternarAlerta(
    pelicula: Pelicula
  ) {

    if (!pelicula.id) {

      return;

    }


    if (
      !this.logueado()
    ) {

      this.mensaje.set(
        'Iniciá sesión para activar alertas.'
      );

      return;

    }


    if (
      this.alertaActiva(
        pelicula.id
      )
    ) {

      await this.proximamenteService
        .desactivarAlerta(
          pelicula.id
        );


      const nuevas =
        new Set(
          this.alertas()
        );


      nuevas.delete(
        pelicula.id
      );


      this.alertas.set(
        nuevas
      );


      this.mensaje.set(
        'Alerta desactivada.'
      );

      return;

    }


    await this.proximamenteService
      .solicitarPermisoNotificaciones();


    const {
      error
    } =
      await this.proximamenteService
        .activarAlerta(
          pelicula.id
        );


    if (error) {

      this.mensaje.set(
        error.message
      );

      return;

    }


    const nuevas =
      new Set(
        this.alertas()
      );


    nuevas.add(
      pelicula.id
    );


    this.alertas.set(
      nuevas
    );


    this.mensaje.set(
      `Te avisaremos cuando haya entradas para ${pelicula.nombre}.`
    );

  }

}