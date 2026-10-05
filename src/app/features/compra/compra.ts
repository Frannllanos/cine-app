import {
  Component,
  OnDestroy,
  OnInit,
  signal
} from '@angular/core';

import {
  ActivatedRoute,
  RouterLink
} from '@angular/router';

import {
  FormsModule
} from '@angular/forms';

import QRCode from 'qrcode';

import {
  jsPDF
} from 'jspdf';

import {
  FuncionService
} from '../../core/services/funcion';

import {
  CompraService
} from '../../core/services/compra';

import {
  ProductoService
} from '../../core/services/producto';

import {
  ComboService
} from '../../core/services/combo';

import {
  CuponService
} from '../../core/services/cupon';

import {
  PeliculaService
} from '../../core/services/pelicula';

import {
  AuthService
} from '../../core/services/auth';

import {
  FidelizacionService
} from '../../core/services/fidelizacion';

import {
  Funcion
} from '../../core/models/funcion.interface';

import {
  Producto
} from '../../core/models/producto.interface';

import {
  Combo
} from '../../core/models/combo.interface';

import {
  Cupon
} from '../../core/models/cupon.interface';

import {
  Pelicula
} from '../../core/models/pelicula.interface';

import {
  Canje
} from '../../core/models/canje.interface';


interface ButacaVista {

  codigo: string;

  tipo:
    | 'normal'
    | 'accesible'
    | 'vip';

  precio: number;

}


interface FilaSala {

  letra: string;

  grupos: ButacaVista[][];

}


interface ProductoSeleccionado {

  producto: Producto;

  cantidad: number;

}


interface ComboSeleccionado {

  combo: Combo;

  cantidad: number;

}


@Component({
  selector: 'app-compra',

  imports: [
    RouterLink,
    FormsModule
  ],

  templateUrl:
    './compra.html',

  styleUrl:
    './compra.css'
})
export class Compra
  implements OnInit, OnDestroy {

  funcion =
    signal<Funcion | null>(
      null
    );


  pelicula =
    signal<Pelicula | null>(
      null
    );


  filas =
    signal<FilaSala[]>([]);


  ocupadas =
    signal<Set<string>>(
      new Set()
    );


  seleccionadas =
    signal<ButacaVista[]>([]);


  productos =
    signal<Producto[]>([]);


  productosSeleccionados =
    signal<ProductoSeleccionado[]>(
      []
    );


  combos =
    signal<Combo[]>([]);


  combosSeleccionados =
    signal<ComboSeleccionado[]>(
      []
    );


  canjesDisponibles =
    signal<Canje[]>([]);


  canjesSeleccionados =
    signal<number[]>([]);


  cuponAplicado =
    signal<Cupon | null>(
      null
    );


  creditoDisponible =
    signal(0);


  restriccionBloqueada =
    signal(false);


  mensajeEdad =
    signal('');


  compraRealizada =
    signal(false);


  codigoCompra =
    signal('');


  mensaje =
    signal('');


  cuponMensaje =
    signal('');


  qrImagen =
    signal('');


  totalCompra =
    signal(0);


  creditoUsadoCompra =
    signal(0);


  montoPagadoCompra =
    signal(0);


  cuponCodigo = '';


  creditoAUsar = 0;


  canal: any;


  constructor(

    private route:
      ActivatedRoute,

    private funcionService:
      FuncionService,

    private compraService:
      CompraService,

    private productoService:
      ProductoService,

    private comboService:
      ComboService,

    private cuponService:
      CuponService,

    private peliculaService:
      PeliculaService,

    private authService:
      AuthService,

    private fidelizacionService:
      FidelizacionService

  ) {}


  async ngOnInit() {

    const funcionId =
      Number(
        this.route.snapshot
          .queryParamMap
          .get('funcion')
      );


    if (!funcionId) {

      this.mensaje.set(
        'No se seleccionó una función.'
      );

      return;

    }


    const funcion =
      await this.funcionService
        .obtenerFuncion(
          funcionId
        );


    if (!funcion) {

      this.mensaje.set(
        'La función no existe.'
      );

      return;

    }


    this.funcion.set(
      funcion
    );


    const pelicula =
      await this.peliculaService
        .obtenerPelicula(
          funcion.pelicula_id
        );


    this.pelicula.set(
      pelicula
    );


    await this
      .verificarRestriccionEdad();


    await this
      .cargarCredito();


    this.crearSala(
      Number(
        funcion.precio
      )
    );


    await this
      .actualizarOcupadas();


    this.productos.set(
      await this.productoService
        .obtenerProductos()
    );


    this.combos.set(
      await this.comboService
        .obtenerCombos()
    );


    this.canjesDisponibles.set(
      await this.fidelizacionService
        .obtenerCanjesDisponibles()
    );


    await this
      .aplicarBeneficioPrimeraCompra();


    this.canal =
      this.compraService
        .escucharButacas(

          funcionId,

          async () => {

            await this
              .actualizarOcupadas();

          }

        );

  }


  async cargarCredito() {

    const perfil =
      await this.authService
        .obtenerPerfil();


    this.creditoDisponible.set(
      Number(
        perfil?.credito
        ??
        0
      )
    );

  }


  usarTodoCredito() {

    this.creditoAUsar =
      this.maximoCreditoUsable();

  }


  quitarCredito() {

    this.creditoAUsar =
      0;

  }


  maximoCreditoUsable() {

    return Math.min(
      this.creditoDisponible(),
      this.totalAntesCredito()
    );

  }


  creditoAplicado() {

    const solicitado =
      Number(
        this.creditoAUsar
        ??
        0
      );


    return Math.max(
      0,

      Math.min(
        solicitado,
        this.creditoDisponible(),
        this.totalAntesCredito()
      )
    );

  }


  async verificarRestriccionEdad() {

    const restriccion =
      Number(
        this.pelicula()
          ?.restriccion_edad
        ??
        0
      );


    if (
      restriccion <= 0
    ) {

      this.restriccionBloqueada
        .set(false);

      this.mensajeEdad.set('');

      return;

    }


    const perfil =
      await this.authService
        .obtenerPerfil();


    if (
      !perfil?.fecha_nacimiento
    ) {

      this.restriccionBloqueada
        .set(true);


      this.mensajeEdad.set(
        `Esta película es +${restriccion}. Tu perfil no tiene una fecha de nacimiento válida.`
      );

      return;

    }


    const edad =
      this.calcularEdad(
        perfil.fecha_nacimiento
      );


    if (
      edad < restriccion
    ) {

      this.restriccionBloqueada
        .set(true);


      this.mensajeEdad.set(
        `Esta película es +${restriccion}. Tenés ${edad} años y no podés comprar esta entrada.`
      );

      return;

    }


    this.restriccionBloqueada
      .set(false);


    this.mensajeEdad.set(
      `Película +${restriccion}. La entrada debe indicar el requisito de acompañamiento de un adulto.`
    );

  }


  calcularEdad(
    fechaNacimiento: string
  ) {

    const hoy =
      new Date();


    const nacimiento =
      new Date(
        `${fechaNacimiento}T00:00:00`
      );


    let edad =
      hoy.getFullYear()
      -
      nacimiento.getFullYear();


    const diferenciaMes =
      hoy.getMonth()
      -
      nacimiento.getMonth();


    if (
      diferenciaMes < 0
      ||
      (
        diferenciaMes === 0
        &&
        hoy.getDate()
        <
        nacimiento.getDate()
      )
    ) {

      edad--;

    }


    return edad;

  }


  async aplicarBeneficioPrimeraCompra() {

    const cupon =
      await this.cuponService
        .obtenerCuponPrimeraCompraDisponible();


    if (!cupon) {

      return;

    }


    this.cuponAplicado.set(
      cupon
    );


    this.cuponMensaje.set(
      `Beneficio de primera compra aplicado automáticamente: ${cupon.porcentaje}%.`
    );

  }


  async aplicarCuponManual() {

    const codigo =
      this.cuponCodigo.trim();


    if (!codigo) {

      return;

    }


    const resultado =
      await this.cuponService
        .validarCuponParaUsuario(
          codigo
        );


    if (
      !resultado.valido
      ||
      !resultado.cupon
    ) {

      this.cuponMensaje.set(
        resultado.mensaje
      );

      return;

    }


    this.cuponAplicado.set(
      resultado.cupon
    );


    this.cuponMensaje.set(
      resultado.mensaje
    );

  }


  quitarCupon() {

    this.cuponAplicado.set(
      null
    );


    this.cuponCodigo = '';

  }


  crearSala(
    precioBase: number
  ) {

    const letras =
      'ABCDEFGHIJKLMNOPQRST'
        .split('');


    const filas =
      letras.map(
        letra => {

          const accesible =
            letra === 'J'
            ||
            letra === 'K';


          const vip =
            letra === 'R'
            ||
            letra === 'S'
            ||
            letra === 'T';


          const cantidades =
            accesible
              ? [2, 10, 2]
              : [4, 20, 4];


          let numero = 1;


          const grupos =
            cantidades.map(
              cantidad => {

                const grupo:
                  ButacaVista[] = [];


                for (
                  let i = 0;
                  i < cantidad;
                  i++
                ) {

                  let tipo:
                    'normal'
                    | 'accesible'
                    | 'vip'
                    =
                    'normal';


                  if (accesible) {

                    tipo =
                      'accesible';

                  } else if (vip) {

                    tipo =
                      'vip';

                  }


                  grupo.push({

                    codigo:
                      `${letra}${numero}`,

                    tipo,

                    precio:
                      vip
                        ? precioBase * 1.30
                        : precioBase

                  });


                  numero++;

                }


                return grupo;

              }
            );


          return {

            letra,

            grupos

          };

        }
      );


    this.filas.set(
      filas
    );

  }


  async actualizarOcupadas() {

    const funcion =
      this.funcion();


    if (!funcion?.id) {

      return;

    }


    const codigos =
      await this.compraService
        .obtenerButacasOcupadas(
          funcion.id
        );


    this.ocupadas.set(
      new Set(codigos)
    );

  }


  estaOcupada(
    codigo: string
  ) {

    return this.ocupadas()
      .has(codigo);

  }


  estaSeleccionada(
    codigo: string
  ) {

    return this.seleccionadas()
      .some(
        butaca =>
          butaca.codigo
          ===
          codigo
      );

  }


  seleccionar(
    butaca: ButacaVista
  ) {

    if (
      this.restriccionBloqueada()
      ||
      this.estaOcupada(
        butaca.codigo
      )
    ) {

      return;

    }


    const seleccionadas =
      [
        ...this.seleccionadas()
      ];


    const indice =
      seleccionadas.findIndex(
        item =>
          item.codigo
          ===
          butaca.codigo
      );


    if (
      indice >= 0
    ) {

      const nuevaCantidad =
        seleccionadas.length - 1;


      if (
        this.cantidadTotalCombos()
        >
        nuevaCantidad
      ) {

        this.mensaje.set(
          'Primero quitá un combo.'
        );

        return;

      }


      if (
        this.cantidadCanjesEntradaSeleccionados()
        >
        nuevaCantidad
      ) {

        this.mensaje.set(
          'Primero quitá un canje de entrada.'
        );

        return;

      }


      seleccionadas.splice(
        indice,
        1
      );

    } else {

      seleccionadas.push(
        butaca
      );

    }


    this.seleccionadas.set(
      seleccionadas
    );


    this.mensaje.set('');

  }


  estaCanjeSeleccionado(
    id?: number
  ) {

    if (!id) {

      return false;

    }


    return this.canjesSeleccionados()
      .includes(
        id
      );

  }


  cantidadCanjesEntradaSeleccionados() {

    return this.canjesDisponibles()
      .filter(
        canje =>
          canje.id
          &&
          this.canjesSeleccionados()
            .includes(
              canje.id
            )
          &&
          canje.recompensas?.tipo
          ===
          'entrada'
      )
      .length;

  }


  alternarCanje(
    canje: Canje
  ) {

    if (!canje.id) {

      return;

    }


    const seleccionados =
      [
        ...this.canjesSeleccionados()
      ];


    const indice =
      seleccionados.indexOf(
        canje.id
      );


    if (
      indice >= 0
    ) {

      seleccionados.splice(
        indice,
        1
      );


      this.canjesSeleccionados.set(
        seleccionados
      );

      return;

    }


    if (
      canje.recompensas?.tipo
      ===
      'entrada'
      &&
      this.cantidadCanjesEntradaSeleccionados()
      >=
      this.seleccionadas().length
    ) {

      this.mensaje.set(
        'Seleccioná una butaca disponible para usar esta recompensa.'
      );

      return;

    }


    seleccionados.push(
      canje.id
    );


    this.canjesSeleccionados.set(
      seleccionados
    );

  }


  agregarProducto(
    producto: Producto
  ) {

    const lista =
      this.productosSeleccionados()
        .map(
          item => ({
            ...item
          })
        );


    const existente =
      lista.find(
        item =>
          item.producto.id
          ===
          producto.id
      );


    if (existente) {

      existente.cantidad++;

    } else {

      lista.push({
        producto,
        cantidad: 1
      });

    }


    this.productosSeleccionados
      .set(lista);

  }


  quitarProducto(
    producto: Producto
  ) {

    const lista =
      this.productosSeleccionados()
        .map(
          item => ({
            ...item
          })
        );


    const indice =
      lista.findIndex(
        item =>
          item.producto.id
          ===
          producto.id
      );


    if (
      indice === -1
    ) {

      return;

    }


    if (
      lista[indice].cantidad > 1
    ) {

      lista[indice].cantidad--;

    } else {

      lista.splice(
        indice,
        1
      );

    }


    this.productosSeleccionados
      .set(lista);

  }


  cantidadProducto(
    productoId?: number
  ) {

    return (
      this.productosSeleccionados()
        .find(
          item =>
            item.producto.id
            ===
            productoId
        )
        ?.cantidad
      ??
      0
    );

  }


  agregarCombo(
    combo: Combo
  ) {

    if (
      this.cantidadTotalCombos()
      >=
      this.seleccionadas().length
    ) {

      return;

    }


    const lista =
      this.combosSeleccionados()
        .map(
          item => ({
            ...item
          })
        );


    const existente =
      lista.find(
        item =>
          item.combo.id
          ===
          combo.id
      );


    if (existente) {

      existente.cantidad++;

    } else {

      lista.push({
        combo,
        cantidad: 1
      });

    }


    this.combosSeleccionados
      .set(lista);

  }


  quitarCombo(
    combo: Combo
  ) {

    const lista =
      this.combosSeleccionados()
        .map(
          item => ({
            ...item
          })
        );


    const indice =
      lista.findIndex(
        item =>
          item.combo.id
          ===
          combo.id
      );


    if (
      indice === -1
    ) {

      return;

    }


    if (
      lista[indice].cantidad > 1
    ) {

      lista[indice].cantidad--;

    } else {

      lista.splice(
        indice,
        1
      );

    }


    this.combosSeleccionados
      .set(lista);

  }


  cantidadCombo(
    comboId?: number
  ) {

    return (
      this.combosSeleccionados()
        .find(
          item =>
            item.combo.id
            ===
            comboId
        )
        ?.cantidad
      ??
      0
    );

  }


  cantidadTotalCombos() {

    return this.combosSeleccionados()
      .reduce(
        (
          total,
          item
        ) =>
          total
          +
          item.cantidad,
        0
      );

  }


  totalEntradas() {

    return this.seleccionadas()
      .reduce(
        (
          total,
          butaca
        ) =>
          total
          +
          Number(
            butaca.precio
          ),
        0
      );

  }


  totalCandy() {

    return this.productosSeleccionados()
      .reduce(
        (
          total,
          item
        ) =>
          total
          +
          Number(
            item.producto.precio
          )
          *
          item.cantidad,
        0
      );

  }


  totalAjusteCombos() {

    const precioBase =
      Number(
        this.funcion()?.precio
        ??
        0
      );


    return this.combosSeleccionados()
      .reduce(
        (
          total,
          item
        ) =>
          total
          +
          (
            Number(
              item.combo.precio
            )
            -
            precioBase
          )
          *
          item.cantidad,
        0
      );

  }


  subtotal() {

    return (
      this.totalEntradas()
      +
      this.totalCandy()
      +
      this.totalAjusteCombos()
    );

  }


  descuentoRecompensas() {

    const precioBase =
      Number(
        this.funcion()?.precio
        ??
        0
      );


    return (
      precioBase
      *
      this.cantidadCanjesEntradaSeleccionados()
    );

  }


  baseParaCupon() {

    return Math.max(
      0,

      this.subtotal()
      -
      this.descuentoRecompensas()
    );

  }


  descuentoCupon() {

    const cupon =
      this.cuponAplicado();


    if (!cupon) {

      return 0;

    }


    return (
      this.baseParaCupon()
      *
      Number(
        cupon.porcentaje
      )
      /
      100
    );

  }


  totalAntesCredito() {

    return Math.max(
      0,

      this.baseParaCupon()
      -
      this.descuentoCupon()
    );

  }


  total() {

    return Math.max(
      0,

      this.totalAntesCredito()
      -
      this.creditoAplicado()
    );

  }


  async confirmarCompra() {

    const funcion =
      this.funcion();


    if (
      !funcion?.id
      ||
      this.seleccionadas().length === 0
    ) {

      return;

    }


    const resultado =
      await this.compraService
        .crearCompra(

          funcion.id,

          this.seleccionadas()
            .map(
              butaca => ({

                codigo_butaca:
                  butaca.codigo,

                tipo:
                  butaca.tipo

              })
            ),

          this.productosSeleccionados()
            .map(
              item => ({

                producto_id:
                  item.producto.id!,

                cantidad:
                  item.cantidad

              })
            ),

          this.combosSeleccionados()
            .map(
              item => ({

                combo_id:
                  item.combo.id!,

                cantidad:
                  item.cantidad

              })
            ),

          this.cuponAplicado()?.id
          ??
          null,

          this.canjesSeleccionados(),

          this.creditoAplicado()

        );


    if (
      resultado.error
    ) {

      console.error(
        resultado.error
      );


      this.mensaje.set(
        resultado.error.message
        ||
        'No se pudo realizar la compra.'
      );

      return;

    }


    this.codigoCompra.set(
      resultado.codigo!
    );


    this.totalCompra.set(
      Number(
        resultado.compra.total
      )
    );


    this.creditoUsadoCompra.set(
      Number(
        resultado.compra.credito_usado
        ??
        0
      )
    );


    this.montoPagadoCompra.set(
      Number(
        resultado.compra.monto_pagado
        ??
        0
      )
    );


    this.qrImagen.set(
      await QRCode.toDataURL(
        resultado.codigo!
      )
    );


    this.compraRealizada.set(
      true
    );


    await this
      .actualizarOcupadas();

  }


  descargarEntrada() {

    if (
      !this.qrImagen()
    ) {

      return;

    }


    const pdf =
      new jsPDF();


    pdf.setFontSize(22);

    pdf.text(
      'Cine App',
      20,
      20
    );


    pdf.setFontSize(12);

    pdf.text(
      `Total: $${this.totalCompra().toFixed(2)}`,
      20,
      40
    );


    pdf.text(
      `Credito utilizado: $${this.creditoUsadoCompra().toFixed(2)}`,
      20,
      50
    );


    pdf.text(
      `Monto pagado: $${this.montoPagadoCompra().toFixed(2)}`,
      20,
      60
    );


    pdf.addImage(
      this.qrImagen(),
      'PNG',
      20,
      75,
      60,
      60
    );


    pdf.text(
      this.codigoCompra(),
      20,
      145
    );


    pdf.save(
      `entrada-${this.codigoCompra()}.pdf`
    );

  }


  ngOnDestroy() {

    if (this.canal) {

      this.canal.unsubscribe();

    }

  }

}