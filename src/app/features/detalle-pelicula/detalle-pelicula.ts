import {
  Component,
  OnInit,
  signal
} from '@angular/core';

import {
  DatePipe
} from '@angular/common';

import {
  FormsModule
} from '@angular/forms';

import {
  ActivatedRoute,
  RouterLink
} from '@angular/router';

import {
  PeliculaService
} from '../../core/services/pelicula';

import {
  FuncionService
} from '../../core/services/funcion';

import {
  ResenaService
} from '../../core/services/resena';

import {
  AuthService
} from '../../core/services/auth';

import {
  Pelicula
} from '../../core/models/pelicula.interface';

import {
  Funcion
} from '../../core/models/funcion.interface';

import {
  Resena
} from '../../core/models/resena.interface';


@Component({
  selector:
    'app-detalle-pelicula',

  imports: [
    DatePipe,
    RouterLink,
    FormsModule
  ],

  templateUrl:
    './detalle-pelicula.html',

  styleUrl:
    './detalle-pelicula.css'
})
export class DetallePelicula
  implements OnInit {

  pelicula =
    signal<Pelicula | null>(
      null
    );


  funciones =
    signal<Funcion[]>([]);


  resenas =
    signal<Resena[]>([]);


  logueado =
    signal(false);


  peliculaId = 0;


  puntuacion = 0;


  comentario = '';


  mensajeResena =
    signal('');


  guardando =
    signal(false);


  estrellasSeleccionables =
    [
      1,
      2,
      3,
      4,
      5
    ];


  constructor(

    private route:
      ActivatedRoute,

    private peliculaService:
      PeliculaService,

    private funcionService:
      FuncionService,

    private resenaService:
      ResenaService,

    private authService:
      AuthService

  ) {}


  async ngOnInit() {

    this.peliculaId =
      Number(
        this.route.snapshot
          .paramMap
          .get('id')
      );


    if (!this.peliculaId) {

      return;

    }


    this.pelicula.set(
      await this.peliculaService
        .obtenerPelicula(
          this.peliculaId
        )
    );


    this.funciones.set(
      await this.funcionService
        .obtenerFuncionesPorPelicula(
          this.peliculaId
        )
    );


    await this
      .cargarResenas();


    const sesion =
      await this.authService
        .obtenerSesion();


    this.logueado.set(
      !!sesion
    );


    if (sesion) {

      const miResena =
        await this.resenaService
          .obtenerMiResena(
            this.peliculaId
          );


      if (miResena) {

        this.puntuacion =
          miResena.puntuacion;


        this.comentario =
          miResena.comentario;

      }

    }

  }


  async cargarResenas() {

    this.resenas.set(
      await this.resenaService
        .obtenerResenasPorPelicula(
          this.peliculaId
        )
    );

  }


  seleccionarPuntuacion(
    puntuacion: number
  ) {

    this.puntuacion =
      puntuacion;

  }


  promedioResenas() {

    const lista =
      this.resenas();


    if (
      lista.length === 0
    ) {

      return 0;

    }


    const total =
      lista.reduce(
        (
          acumulado,
          resena
        ) =>
          acumulado
          +
          Number(
            resena.puntuacion
          ),
        0
      );


    return (
      total
      /
      lista.length
    );

  }


  textoEstrellas(
    puntuacion: number
  ) {

    const cantidad =
      Math.max(
        0,
        Math.min(
          5,
          Math.round(
            Number(
              puntuacion
            )
          )
        )
      );


    return (
      '★'.repeat(
        cantidad
      )
      +
      '☆'.repeat(
        5 - cantidad
      )
    );

  }


  async guardarResena() {

    if (
      this.puntuacion < 1
      ||
      this.puntuacion > 5
    ) {

      this.mensajeResena.set(
        'Seleccioná entre 1 y 5 estrellas.'
      );

      return;

    }


    if (
      this.comentario.length > 300
    ) {

      this.mensajeResena.set(
        'El comentario no puede superar los 300 caracteres.'
      );

      return;

    }


    this.guardando.set(
      true
    );


    const {
      error
    } =
      await this.resenaService
        .guardarResena(

          this.peliculaId,

          this.puntuacion,

          this.comentario

        );


    this.guardando.set(
      false
    );


    if (error) {

      console.error(
        error
      );


      this.mensajeResena.set(
        error.message
        ||
        'No se pudo guardar la reseña.'
      );

      return;

    }


    this.mensajeResena.set(
      'Reseña guardada correctamente.'
    );


    await this
      .cargarResenas();

  }

}