import {
  Component,
  OnInit,
  signal
} from '@angular/core';

import {
  DatePipe
} from '@angular/common';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  PeliculaService
} from '../../core/services/pelicula';

import {
  FuncionService
} from '../../core/services/funcion';

import {
  Pelicula
} from '../../core/models/pelicula.interface';


@Component({
  selector: 'app-admin-funciones',

  imports: [
    ReactiveFormsModule,
    DatePipe
  ],

  templateUrl:
    './admin-funciones.html',

  styleUrl:
    './admin-funciones.css'
})
export class AdminFunciones
  implements OnInit {

  peliculas =
    signal<Pelicula[]>([]);


  funciones =
    signal<any[]>([]);


  mensaje =
    signal('');


  creando =
    signal(false);


  minFechaHora = '';


  formulario;


  constructor(

    private fb:
      FormBuilder,

    private peliculaService:
      PeliculaService,

    private funcionService:
      FuncionService

  ) {

    this.formulario =
      this.fb.group({

        pelicula_id: [
          0,
          Validators.required
        ],

        fecha_hora: [
          '',
          Validators.required
        ],

        formato: [
          '2D',
          Validators.required
        ],

        idioma: [
          'Castellano',
          Validators.required
        ],

        precio: [
          8500,
          [
            Validators.required,
            Validators.min(1)
          ]
        ]

      });

  }


  async ngOnInit() {

    this.minFechaHora =
      this.fechaLocalInput(
        new Date()
      );


    this.peliculas.set(
      await this.peliculaService
        .obtenerPeliculas()
    );


    await this
      .cargarFunciones();

  }


  async cargarFunciones() {

    this.funciones.set(
      await this.funcionService
        .obtenerFunciones()
    );

  }


  async guardar() {

    if (
      this.formulario.invalid
    ) {

      this.mensaje.set(
        'Completá todos los datos.'
      );

      return;

    }


    const valores =
      this.formulario
        .getRawValue();


    const peliculaId =
      Number(
        valores.pelicula_id
        ??
        0
      );


    const precio =
      Number(
        valores.precio
        ??
        0
      );


    if (
      peliculaId <= 0
      ||
      precio <= 0
      ||
      !valores.fecha_hora
    ) {

      this.mensaje.set(
        'Revisá película, fecha y precio.'
      );

      return;

    }


    const fecha =
      new Date(
        valores.fecha_hora
      );


    if (
      Number.isNaN(
        fecha.getTime()
      )
    ) {

      this.mensaje.set(
        'La fecha ingresada no es válida.'
      );

      return;

    }


    this.creando.set(
      true
    );


    this.mensaje.set('');


    const {
      data,
      error
    } =
      await this.funcionService
        .crearFuncionAutomatica(

          peliculaId,

          fecha.toISOString(),

          valores.formato
          ??
          '2D',

          valores.idioma
          ??
          'Castellano',

          precio

        );


    this.creando.set(
      false
    );


    if (error) {

      console.error(
        error
      );


      this.mensaje.set(
        error.message
        ||
        'No se pudo crear la función.'
      );

      return;

    }


    const funcionCreada =
      Array.isArray(data)
        ? data[0]
        : data;


    this.mensaje.set(
      `Función creada correctamente. Sala asignada automáticamente: ${funcionCreada?.sala_id ?? ''}.`
    );


    this.formulario.reset({

      pelicula_id:
        0,

      fecha_hora:
        '',

      formato:
        '2D',

      idioma:
        'Castellano',

      precio:
        8500

    });


    await this
      .cargarFunciones();

  }


  async eliminar(
    funcion: any
  ) {

    if (!funcion?.id) {

      return;

    }


    const confirmar =
      window.confirm(
        '¿Eliminar esta función?'
      );


    if (!confirmar) {

      return;

    }


    const {
      error
    } =
      await this.funcionService
        .eliminarFuncion(
          funcion.id
        );


    if (error) {

      console.error(
        error
      );


      this.mensaje.set(
        error.message
        ||
        'No se pudo eliminar la función.'
      );

      return;

    }


    this.mensaje.set(
      'Función eliminada.'
    );


    await this
      .cargarFunciones();

  }


  private fechaLocalInput(
    fecha: Date
  ) {

    const ajustar =
      new Date(
        fecha.getTime()
        -
        fecha.getTimezoneOffset()
        *
        60000
      );


    return ajustar
      .toISOString()
      .slice(
        0,
        16
      );

  }

}