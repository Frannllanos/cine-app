import {
  Component,
  OnInit,
  signal
} from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  FidelizacionService
} from '../../core/services/fidelizacion';

import {
  ProductoService
} from '../../core/services/producto';

import {
  Recompensa
} from '../../core/models/recompensa.interface';

import {
  Producto
} from '../../core/models/producto.interface';


@Component({
  selector: 'app-admin-recompensas',

  imports: [
    ReactiveFormsModule
  ],

  templateUrl:
    './admin-recompensas.html',

  styleUrl:
    './admin-recompensas.css'
})
export class AdminRecompensas
  implements OnInit {

  recompensas =
    signal<Recompensa[]>([]);


  productos =
    signal<Producto[]>([]);


  mensaje = '';


  formulario;


  constructor(

    private fb:
      FormBuilder,

    private fidelizacionService:
      FidelizacionService,

    private productoService:
      ProductoService

  ) {

    this.formulario =
      this.fb.group({

        nombre: [
          '',
          Validators.required
        ],

        tipo: [
          'entrada',
          Validators.required
        ],

        producto_id: [
          0
        ],

        costo_puntos: [
          500,
          [
            Validators.required,
            Validators.min(1)
          ]
        ]

      });

  }


  async ngOnInit() {

    await this
      .cargarRecompensas();


    this.productos.set(
      await this.productoService
        .obtenerProductos()
    );

  }


  async cargarRecompensas() {

    this.recompensas.set(
      await this.fidelizacionService
        .obtenerTodasRecompensas()
    );

  }


  async guardar() {

    if (
      this.formulario.invalid
    ) {

      this.mensaje =
        'Completá correctamente los datos.';

      return;

    }


    const valores =
      this.formulario
        .getRawValue();


    let tipo:
      'entrada'
      |
      'producto';


    if (
      valores.tipo
      ===
      'producto'
    ) {

      tipo =
        'producto';

    } else {

      tipo =
        'entrada';

    }


    const productoId =
      Number(
        valores.producto_id
        ??
        0
      );


    if (
      tipo === 'producto'
      &&
      productoId <= 0
    ) {

      this.mensaje =
        'Seleccioná el producto de Candy.';

      return;

    }


    const nombre =
      valores.nombre
        ?.trim()
      ??
      '';


    const costoPuntos =
      Number(
        valores.costo_puntos
        ??
        0
      );


    if (
      !nombre
      ||
      costoPuntos <= 0
    ) {

      this.mensaje =
        'Completá correctamente los datos.';

      return;

    }


    const recompensa:
      Recompensa = {

      nombre,

      tipo,

      producto_id:
        tipo === 'producto'
          ? productoId
          : null,

      costo_puntos:
        costoPuntos,

      activo:
        true

    };


    const {
      error
    } =
      await this.fidelizacionService
        .crearRecompensa(
          recompensa
        );


    if (error) {

      console.error(
        error
      );


      this.mensaje =
        'No se pudo crear la recompensa.';

      return;

    }


    this.mensaje =
      'Recompensa creada correctamente.';


    this.formulario.reset({

      nombre:
        '',

      tipo:
        'entrada',

      producto_id:
        0,

      costo_puntos:
        500

    });


    await this
      .cargarRecompensas();

  }


  async cambiarEstado(
    recompensa: Recompensa
  ) {

    const {
      error
    } =
      await this.fidelizacionService
        .cambiarEstado(
          recompensa
        );


    if (error) {

      console.error(
        error
      );


      this.mensaje =
        'No se pudo modificar la recompensa.';

      return;

    }


    this.mensaje =
      recompensa.activo
        ? 'Recompensa desactivada.'
        : 'Recompensa activada.';


    await this
      .cargarRecompensas();

  }


  async eliminar(
    id?: number
  ) {

    if (!id) {

      return;

    }


    const {
      error
    } =
      await this.fidelizacionService
        .eliminarRecompensa(
          id
        );


    if (error) {

      console.error(
        error
      );


      this.mensaje =
        'No se pudo eliminar la recompensa.';

      return;

    }


    this.mensaje =
      'Recompensa eliminada.';


    await this
      .cargarRecompensas();

  }

}