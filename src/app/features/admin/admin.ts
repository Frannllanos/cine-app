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
  PeliculaService
} from '../../core/services/pelicula';

import {
  Pelicula
} from '../../core/models/pelicula.interface';

import {
  ProductoService
} from '../../core/services/producto';

import {
  Producto
} from '../../core/models/producto.interface';

import {
  ComboService
} from '../../core/services/combo';

import {
  Combo
} from '../../core/models/combo.interface';

import {
  CuponService
} from '../../core/services/cupon';

import {
  Cupon
} from '../../core/models/cupon.interface';


@Component({
  selector: 'app-admin',
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class Admin implements OnInit {

  peliculas =
    signal<Pelicula[]>([]);


  productos =
    signal<Producto[]>([]);


  combos =
    signal<Combo[]>([]);


  cupones =
    signal<Cupon[]>([]);


  archivoSeleccionado:
    File | null = null;


  archivoProducto:
    File | null = null;


  mensaje = '';


  formulario;

  formularioProducto;

  formularioCombo;

  formularioCupon;


  constructor(

    private fb:
      FormBuilder,

    private peliculaService:
      PeliculaService,

    private productoService:
      ProductoService,

    private comboService:
      ComboService,

    private cuponService:
      CuponService

  ) {

    this.formulario =
      this.fb.group({

        nombre: [
          '',
          Validators.required
        ],

        sinopsis: [
          '',
          Validators.required
        ],

        duracion: [
          90,
          Validators.required
        ],

        generos: [
          '',
          Validators.required
        ],

        restriccion_edad: [
          0
        ],

        en_cartelera: [
          true
        ],

        proximamente: [
          false
        ],

        fecha_estreno: [
          ''
        ],

        preventa_activa: [
          false
        ],

        precio_preventa: [
          null
        ]

      });


    this.formularioProducto =
      this.fb.group({

        nombre: [
          '',
          Validators.required
        ],

        categoria: [
          '',
          Validators.required
        ],

        precio: [
          0,
          [
            Validators.required,
            Validators.min(1)
          ]
        ]

      });


    this.formularioCombo =
      this.fb.group({

        nombre: [
          '',
          Validators.required
        ],

        pochoclo_id: [
          0,
          Validators.required
        ],

        bebida_id: [
          0,
          Validators.required
        ],

        precio: [
          0,
          [
            Validators.required,
            Validators.min(1)
          ]
        ]

      });


    this.formularioCupon =
      this.fb.group({

        nombre: [
          '',
          Validators.required
        ],

        codigo: [
          '',
          Validators.required
        ],

        porcentaje: [
          10,
          [
            Validators.required,
            Validators.min(1),
            Validators.max(100)
          ]
        ]

      });

  }


  async ngOnInit() {

    await this.cargarPeliculas();

    await this.cargarProductos();

    await this.cargarCombos();

    await this.cargarCupones();

  }


  async cargarPeliculas() {

    this.peliculas.set(
      await this.peliculaService
        .obtenerPeliculas()
    );

  }


  async cargarProductos() {

    this.productos.set(
      await this.productoService
        .obtenerProductos()
    );

  }


  async cargarCombos() {

    this.combos.set(
      await this.comboService
        .obtenerCombos()
    );

  }


  async cargarCupones() {

    this.cupones.set(
      await this.cuponService
        .obtenerCupones()
    );

  }


  seleccionarArchivo(
    event: Event
  ) {

    const elemento =
      event.target;


    if (
      !(elemento instanceof HTMLInputElement)
    ) {

      return;

    }


    const archivo =
      elemento.files?.[0];


    if (!archivo) {

      return;

    }


    this.archivoSeleccionado =
      archivo;

  }


  seleccionarImagenProducto(
    event: Event
  ) {

    const elemento =
      event.target;


    if (
      !(elemento instanceof HTMLInputElement)
    ) {

      return;

    }


    const archivo =
      elemento.files?.[0];


    if (!archivo) {

      return;

    }


    this.archivoProducto =
      archivo;

  }


async guardar() {

  if (
    this.formulario.invalid
    ||
    !this.archivoSeleccionado
  ) {

    this.mensaje =
      'Completá los datos y seleccioná una imagen';

    return;

  }


  const valores =
    this.formulario.getRawValue();


  const esProximamente =
    !!valores.proximamente;


  const preventaActiva =
    esProximamente
    &&
    !!valores.preventa_activa;


  /*
   * Si es próxima, necesitamos
   * obligatoriamente fecha de estreno.
   */
  if (
    esProximamente
    &&
    !valores.fecha_estreno
  ) {

    this.mensaje =
      'Ingresá la fecha de estreno';

    return;

  }


  /*
   * Si habilita preventa,
   * necesitamos un precio válido.
   */
  if (
    preventaActiva
    &&
    Number(
      valores.precio_preventa
      ??
      0
    )
    <=
    0
  ) {

    this.mensaje =
      'Ingresá un precio de preventa válido';

    return;

  }


  /*
   * SUBIR IMAGEN
   */
  const imagenUrl =
    await this.peliculaService
      .subirImagen(
        this.archivoSeleccionado
      );


  if (!imagenUrl) {

    this.mensaje =
      'No se pudo subir la imagen';

    return;

  }


  /*
   * CREAR OBJETO PELÍCULA
   */
  const pelicula:
    Pelicula = {

    nombre:
      valores.nombre ?? '',

    sinopsis:
      valores.sinopsis ?? '',

    duracion:
      Number(
        valores.duracion
        ??
        0
      ),

    imagen_url:
      imagenUrl,

    generos:
      (
        valores.generos
        ??
        ''
      )
        .split(',')
        .map(
          genero =>
            genero.trim()
        )
        .filter(
          genero =>
            genero.length > 0
        ),

    restriccion_edad:
      Number(
        valores.restriccion_edad
        ??
        0
      ),

    /*
     * Una película próxima todavía
     * no pertenece a la cartelera.
     */
    en_cartelera:
      esProximamente
        ? false
        : !!valores.en_cartelera,

    proximamente:
      esProximamente,

    /*
     * Datos de estreno.
     */
    fecha_estreno:
      esProximamente
        ? valores.fecha_estreno
          ?? undefined
        : undefined,

    /*
     * Preventa.
     */
    preventa_activa:
      preventaActiva,

    precio_preventa:
      preventaActiva
        ? Number(
            valores.precio_preventa
            ??
            0
          )
        : undefined

  };


  /*
   * GUARDAR EN SUPABASE
   */
  const {
    error
  } =
    await this.peliculaService
      .crearPelicula(
        pelicula
      );


  if (error) {

    console.error(
      error
    );

    this.mensaje =
      'Error al crear la película';

    return;

  }


  this.mensaje =
    'Película creada correctamente';


  /*
   * LIMPIAR FORMULARIO
   */
  this.formulario.reset({

    nombre:
      '',

    sinopsis:
      '',

    duracion:
      90,

    generos:
      '',

    restriccion_edad:
      0,

    en_cartelera:
      true,

    proximamente:
      false,

    fecha_estreno:
      '',

    preventa_activa:
      false,

    precio_preventa:
      null

  });


  this.archivoSeleccionado =
    null;


  await this
    .cargarPeliculas();

}

  async eliminar(
    id?: number
  ) {

    if (!id) {
      return;
    }


    await this.peliculaService
      .eliminarPelicula(
        id
      );


    await this
      .cargarPeliculas();

  }


  async guardarProducto() {

    if (
      this.formularioProducto.invalid
      ||
      !this.archivoProducto
    ) {

      this.mensaje =
        'Completá los datos del producto y seleccioná una imagen';

      return;

    }


    const imagen =
      await this.productoService
        .subirImagen(
          this.archivoProducto
        );


    if (!imagen) {

      this.mensaje =
        'No se pudo subir la imagen del producto';

      return;

    }


    const valores =
      this.formularioProducto
        .getRawValue();


    const producto:
      Producto = {

      nombre:
        valores.nombre!,

      categoria:
        valores.categoria!,

      precio:
        Number(
          valores.precio
        ),

      imagen_url:
        imagen,

      activo:
        true

    };


    const {
      error
    } =
      await this.productoService
        .crearProducto(
          producto
        );


    if (error) {

      console.error(
        error
      );

      this.mensaje =
        'No se pudo crear el producto';

      return;

    }


    this.mensaje =
      'Producto creado correctamente';


    this.formularioProducto
      .reset({
        precio: 0
      });


    this.archivoProducto =
      null;


    await this
      .cargarProductos();

  }


  async eliminarProducto(
    id?: number
  ) {

    if (!id) {
      return;
    }


    await this.productoService
      .eliminarProducto(
        id
      );


    await this
      .cargarProductos();

  }


  async guardarCombo() {

    if (
      this.formularioCombo.invalid
    ) {

      this.mensaje =
        'Completá correctamente los datos del combo';

      return;

    }


    const valores =
      this.formularioCombo
        .getRawValue();


    const pochocloId =
      Number(
        valores.pochoclo_id
      );


    const bebidaId =
      Number(
        valores.bebida_id
      );


    const precio =
      Number(
        valores.precio
      );


    if (
      !pochocloId
      ||
      !bebidaId
      ||
      precio <= 0
    ) {

      this.mensaje =
        'Completá correctamente los datos del combo';

      return;

    }


    const combo:
      Combo = {

      nombre:
        valores.nombre!,

      pochoclo_id:
        pochocloId,

      bebida_id:
        bebidaId,

      precio,

      activo:
        true

    };


    const {
      error
    } =
      await this.comboService
        .crearCombo(
          combo
        );


    if (error) {

      console.error(
        error
      );

      this.mensaje =
        'No se pudo crear el combo';

      return;

    }


    this.mensaje =
      'Combo creado correctamente';


    this.formularioCombo
      .reset({

        pochoclo_id:
          0,

        bebida_id:
          0,

        precio:
          0

      });


    await this
      .cargarCombos();

  }


  async eliminarCombo(
    id?: number
  ) {

    if (!id) {
      return;
    }


    await this.comboService
      .eliminarCombo(
        id
      );


    await this
      .cargarCombos();

  }


  async guardarCupon() {

    if (
      this.formularioCupon.invalid
    ) {

      this.mensaje =
        'Completá correctamente los datos del cupón';

      return;

    }


    const valores =
      this.formularioCupon
        .getRawValue();


    const cupon:
      Cupon = {

      nombre:
        valores.nombre!,

      codigo:
        valores.codigo!
          .trim()
          .toUpperCase(),

      porcentaje:
        Number(
          valores.porcentaje
        ),

      tipo:
        'mayores_50',

      activo:
        true

    };


    const {
      error
    } =
      await this.cuponService
        .crearCupon(
          cupon
        );


    if (error) {

      console.error(
        error
      );


      this.mensaje =
        'No se pudo crear el cupón. Verificá que el código no esté repetido.';

      return;

    }


    this.mensaje =
      'Cupón creado correctamente';


    this.formularioCupon
      .reset({

        porcentaje:
          10

      });


    await this
      .cargarCupones();

  }


  async actualizarPorcentajeCupon(
    id: number | undefined,
    valor: string
  ) {

    if (!id) {

      return;

    }


    const porcentaje =
      Number(
        valor
      );


    if (
      porcentaje <= 0
      ||
      porcentaje > 100
    ) {

      this.mensaje =
        'El porcentaje debe estar entre 1 y 100';

      return;

    }


    const {
      error
    } =
      await this.cuponService
        .actualizarCupon(
          id,
          {
            porcentaje
          }
        );


    if (error) {

      console.error(
        error
      );


      this.mensaje =
        'No se pudo actualizar el cupón';

      return;

    }


    this.mensaje =
      'Porcentaje actualizado';


    await this
      .cargarCupones();

  }


  async cambiarEstadoCupon(
    cupon: Cupon
  ) {

    if (!cupon.id) {

      return;

    }


    const {
      error
    } =
      await this.cuponService
        .actualizarCupon(
          cupon.id,
          {
            activo:
              !cupon.activo
          }
        );


    if (error) {

      console.error(
        error
      );


      this.mensaje =
        'No se pudo modificar el cupón';

      return;

    }


    this.mensaje =
      'Estado del cupón actualizado';


    await this
      .cargarCupones();

  }


  async eliminarCupon(
    cupon: Cupon
  ) {

    if (
      !cupon.id
      ||
      cupon.tipo
        === 'primera_compra'
    ) {

      return;

    }


    const {
      error
    } =
      await this.cuponService
        .eliminarCupon(
          cupon.id
        );


    if (error) {

      console.error(
        error
      );


      this.mensaje =
        'No se pudo eliminar el cupón';

      return;

    }


    this.mensaje =
      'Cupón eliminado';


    await this
      .cargarCupones();

  }

}