import {
  Injectable
} from '@angular/core';

import {
  SupabaseService
} from './supabase';

import {
  Entrada
} from '../models/entrada.interface';


@Injectable({
  providedIn: 'root'
})
export class CompraService {

  constructor(
    private supabaseService:
      SupabaseService
  ) {}


  async obtenerButacasOcupadas(
    funcionId: number
  ): Promise<string[]> {

    const {
      data,
      error
    } =
      await this.supabaseService.client
        .from('entradas')
        .select(
          'codigo_butaca'
        )
        .eq(
          'funcion_id',
          funcionId
        );


    if (error) {

      console.error(
        error
      );

      return [];

    }


    return (
      data ?? []
    ).map(
      entrada =>
        entrada.codigo_butaca
    );

  }


  async crearCompra(

    funcionId: number,

    butacas: {
      codigo_butaca: string;
      tipo: string;
    }[],

    productos: {
      producto_id: number;
      cantidad: number;
    }[],

    combos: {
      combo_id: number;
      cantidad: number;
    }[],

    cuponId:
      number | null,

    canjeIds:
      number[],

    creditoSolicitado:
      number

  ) {

    const {
      data: sesionData
    } =
      await this.supabaseService.client.auth
        .getSession();


    const usuario =
      sesionData.session?.user;


    if (!usuario) {

      return {
        error:
          new Error(
            'No hay usuario autenticado'
          )
      };

    }


    if (
      butacas.length === 0
    ) {

      return {
        error:
          new Error(
            'Seleccioná al menos una entrada'
          )
      };

    }


    /*
     * FUNCIÓN + PELÍCULA
     */

    const {
      data: funcionData,
      error: errorFuncion
    } =
      await this.supabaseService.client
        .from('funciones')
        .select(`
          id,
          precio,
          pelicula_id,
          peliculas (
            restriccion_edad,
            fecha_estreno,
            preventa_activa,
            precio_preventa,
            proximamente,
            en_cartelera
          )
        `)
        .eq(
          'id',
          funcionId
        )
        .single();


    if (
      errorFuncion
      ||
      !funcionData
    ) {

      return {
        error:
          errorFuncion
          ??
          new Error(
            'La función no existe'
          )
      };

    }


    const funcion =
      funcionData as any;


    const pelicula =
      funcion.peliculas;


    /*
     * No permitimos comprar una película
     * próxima antes de que se habilite
     * la ventana de preventa.
     */

    if (
      pelicula?.proximamente
      ===
      true
      &&
      pelicula?.en_cartelera
      !==
      true
      &&
      !this.estaEnPreventa(
        pelicula
      )
    ) {

      return {
        error:
          new Error(
            'La preventa de esta película todavía no está disponible.'
          )
      };

    }


    /*
     * PRECIO REAL:
     *
     * - Preventa -> precio_preventa
     * - Resto -> precio normal de función
     */

    const precioBase =
      this.obtenerPrecioActual(

        Number(
          funcion.precio
        ),

        pelicula

      );


    /*
     * RESTRICCIÓN DE EDAD
     */

    const restriccion =
      Number(
        pelicula?.restriccion_edad
        ??
        0
      );


    if (
      restriccion > 0
    ) {

      const {
        data: perfil
      } =
        await this.supabaseService.client
          .from('profiles')
          .select(
            'fecha_nacimiento'
          )
          .eq(
            'id',
            usuario.id
          )
          .single();


      if (
        !perfil?.fecha_nacimiento
        ||
        this.calcularEdad(
          perfil.fecha_nacimiento
        )
        <
        restriccion
      ) {

        return {
          error:
            new Error(
              `No podés comprar esta película +${restriccion}.`
            )
        };

      }

    }


    /*
     * ENTRADAS
     */

    const butacasConPrecio =
      butacas.map(
        butaca => ({

          ...butaca,

          precio:
            butaca.tipo
            ===
            'vip'

              ? precioBase * 1.30

              : precioBase

        })
      );


    const totalEntradas =
      butacasConPrecio
        .reduce(
          (
            total,
            butaca
          ) =>
            total
            +
            butaca.precio,
          0
        );


    /*
     * PRODUCTOS
     */

    let productosValidados:
      any[] = [];


    if (
      productos.length > 0
    ) {

      const ids =
        [
          ...new Set(
            productos.map(
              item =>
                item.producto_id
            )
          )
        ];


      const {
        data,
        error
      } =
        await this.supabaseService.client
          .from('productos')
          .select(
            'id, precio'
          )
          .in(
            'id',
            ids
          )
          .eq(
            'activo',
            true
          );


      if (error) {

        return {
          error
        };

      }


      const mapa =
        new Map(
          (
            data ?? []
          ).map(
            item => [
              item.id,
              Number(
                item.precio
              )
            ]
          )
        );


      for (
        const producto
        of productos
      ) {

        const precio =
          mapa.get(
            producto.producto_id
          );


        if (
          precio === undefined
          ||
          producto.cantidad <= 0
        ) {

          return {
            error:
              new Error(
                'Producto inválido'
              )
          };

        }


        productosValidados.push({

          producto_id:
            producto.producto_id,

          cantidad:
            producto.cantidad,

          precio_unitario:
            precio

        });

      }

    }


    const totalProductos =
      productosValidados
        .reduce(
          (
            total,
            producto
          ) =>
            total
            +
            producto.precio_unitario
            *
            producto.cantidad,
          0
        );


    /*
     * COMBOS
     */

    let combosValidados:
      any[] = [];


    if (
      combos.length > 0
    ) {

      const ids =
        [
          ...new Set(
            combos.map(
              item =>
                item.combo_id
            )
          )
        ];


      const {
        data,
        error
      } =
        await this.supabaseService.client
          .from('combos')
          .select(`
            id,
            precio,
            pochoclo_id,
            bebida_id
          `)
          .in(
            'id',
            ids
          )
          .eq(
            'activo',
            true
          );


      if (error) {

        return {
          error
        };

      }


      const mapa =
        new Map(
          (
            data ?? []
          ).map(
            item => [
              item.id,
              item
            ]
          )
        );


      for (
        const combo
        of combos
      ) {

        const comboBD =
          mapa.get(
            combo.combo_id
          );


        if (!comboBD) {

          return {
            error:
              new Error(
                'Combo inválido'
              )
          };

        }


        combosValidados.push({

          ...comboBD,

          cantidad:
            combo.cantidad

        });

      }

    }


    /*
     * El precio del combo reemplaza
     * al valor BASE de la entrada.
     *
     * Si es VIP, el adicional VIP
     * sigue existiendo.
     */

    const ajusteCombos =
      combosValidados
        .reduce(
          (
            total,
            combo
          ) =>
            total
            +
            (
              Number(
                combo.precio
              )
              -
              precioBase
            )
            *
            combo.cantidad,
          0
        );


    /*
     * CANJES
     */

    const idsCanjes =
      [
        ...new Set(
          canjeIds
        )
      ];


    let canjesValidados:
      any[] = [];


    if (
      idsCanjes.length > 0
    ) {

      const {
        data,
        error
      } =
        await this.supabaseService.client
          .from('canjes')
          .select(`
            id,
            estado,
            recompensas (
              id,
              tipo,
              producto_id
            )
          `)
          .in(
            'id',
            idsCanjes
          )
          .eq(
            'usuario_id',
            usuario.id
          )
          .eq(
            'estado',
            'disponible'
          );


      if (
        error
        ||
        !data
        ||
        data.length
        !==
        idsCanjes.length
      ) {

        return {
          error:
            error
            ??
            new Error(
              'Uno de los canjes ya no está disponible.'
            )
        };

      }


      canjesValidados =
        data as any[];

    }


    const cantidadEntradasGratis =
      canjesValidados
        .filter(
          item =>
            item.recompensas?.tipo
            ===
            'entrada'
        )
        .length;


    if (
      cantidadEntradasGratis
      >
      butacas.length
    ) {

      return {
        error:
          new Error(
            'Hay más canjes de entrada que butacas.'
          )
      };

    }


    /*
     * SUBTOTAL
     */

    const subtotal =
      totalEntradas
      +
      totalProductos
      +
      ajusteCombos;


    /*
     * Una recompensa de entrada
     * descuenta el precio base actual.
     *
     * Si estamos en preventa:
     * descuenta precio_preventa.
     */

    const descuentoRecompensas =
      precioBase
      *
      cantidadEntradasGratis;


    const baseParaCupon =
      Math.max(
        0,

        subtotal
        -
        descuentoRecompensas
      );


    /*
     * CUPÓN
     */

    let descuentoCupon =
      0;


    let cuponValidado:
      any = null;


    if (
      cuponId
    ) {

      const {
        data: cupon
      } =
        await this.supabaseService.client
          .from('cupones')
          .select('*')
          .eq(
            'id',
            cuponId
          )
          .eq(
            'activo',
            true
          )
          .single();


      if (!cupon) {

        return {
          error:
            new Error(
              'Cupón inválido'
            )
        };

      }


      /*
       * PRIMERA COMPRA
       */

      if (
        cupon.tipo
        ===
        'primera_compra'
      ) {

        const {
          count
        } =
          await this.supabaseService.client
            .from('compras')
            .select(
              'id',
              {
                count:
                  'exact',

                head:
                  true
              }
            )
            .eq(
              'usuario_id',
              usuario.id
            );


        if (
          (count ?? 0) > 0
        ) {

          return {
            error:
              new Error(
                'El beneficio de primera compra ya fue utilizado.'
              )
          };

        }

      }


      /*
       * MAYORES DE 50
       */

      if (
        cupon.tipo
        ===
        'mayores_50'
      ) {

        const {
          data: perfil
        } =
          await this.supabaseService.client
            .from('profiles')
            .select(
              'fecha_nacimiento'
            )
            .eq(
              'id',
              usuario.id
            )
            .single();


        if (
          !perfil?.fecha_nacimiento
          ||
          this.calcularEdad(
            perfil.fecha_nacimiento
          )
          <=
          50
        ) {

          return {
            error:
              new Error(
                'Cupón exclusivo para mayores de 50 años.'
              )
          };

        }

      }


      cuponValidado =
        cupon;


      descuentoCupon =
        Math.round(
          (
            baseParaCupon
            *
            Number(
              cupon.porcentaje
            )
            /
            100
          )
          *
          100
        )
        /
        100;

    }


    /*
     * TOTAL
     */

    const total =
      Math.max(
        0,

        Math.round(
          (
            baseParaCupon
            -
            descuentoCupon
          )
          *
          100
        )
        /
        100
      );


    /*
     * CRÉDITO
     */

    const credito =
      Math.max(
        0,

        Number(
          creditoSolicitado
          ??
          0
        )
      );


    if (
      credito > total
    ) {

      return {
        error:
          new Error(
            'El crédito supera el total de la compra.'
          )
      };

    }


    /*
     * COMPRA
     */

    const codigo =
      crypto.randomUUID();


    const {
      data: compra,
      error: errorCompra
    } =
      await this.supabaseService.client
        .from('compras')
        .insert({

          usuario_id:
            usuario.id,

          subtotal,

          descuento:
            descuentoCupon,

          descuento_recompensas:
            descuentoRecompensas,

          cupon_id:
            cuponValidado?.id
            ??
            null,

          total,

          credito_usado:
            credito,

          estado:
            'pagada',

          codigo_qr:
            codigo

        })
        .select()
        .single();


    if (
      errorCompra
      ||
      !compra
    ) {

      return {
        error:
          errorCompra
          ??
          new Error(
            'No se pudo crear la compra.'
          )
      };

    }


    /*
     * ENTRADAS
     */

    const entradas:
      Entrada[] =
      butacasConPrecio.map(
        butaca => ({

          compra_id:
            compra.id,

          funcion_id:
            funcionId,

          codigo_butaca:
            butaca.codigo_butaca,

          tipo:
            butaca.tipo as
              | 'normal'
              | 'accesible'
              | 'vip',

          precio:
            butaca.precio

        })
      );


    const {
      error: errorEntradas
    } =
      await this.supabaseService.client
        .from('entradas')
        .insert(
          entradas
        );


    if (
      errorEntradas
    ) {

      await this
        .eliminarCompraFallida(
          compra.id
        );


      return {
        error:
          errorEntradas
      };

    }


    /*
     * COMBOS DE LA COMPRA
     */

    if (
      combosValidados.length > 0
    ) {

      const {
        error
      } =
        await this.supabaseService.client
          .from('compra_combos')
          .insert(

            combosValidados.map(
              combo => ({

                compra_id:
                  compra.id,

                combo_id:
                  combo.id,

                cantidad:
                  combo.cantidad,

                precio_unitario:
                  combo.precio

              })
            )

          );


      if (error) {

        await this
          .eliminarCompraFallida(
            compra.id
          );


        return {
          error
        };

      }

    }


    /*
     * PRODUCTOS GRATIS DE COMBOS
     * Y RECOMPENSAS
     */

    const productosGratis =
      new Map<
        number,
        number
      >();


    for (
      const combo
      of combosValidados
    ) {

      productosGratis.set(

        combo.pochoclo_id,

        (
          productosGratis.get(
            combo.pochoclo_id
          )
          ??
          0
        )
        +
        combo.cantidad

      );


      productosGratis.set(

        combo.bebida_id,

        (
          productosGratis.get(
            combo.bebida_id
          )
          ??
          0
        )
        +
        combo.cantidad

      );

    }


    for (
      const canje
      of canjesValidados
    ) {

      if (
        canje.recompensas?.tipo
        ===
        'producto'
        &&
        canje.recompensas
          .producto_id
      ) {

        const productoId =
          canje.recompensas
            .producto_id;


        productosGratis.set(

          productoId,

          (
            productosGratis.get(
              productoId
            )
            ??
            0
          )
          +
          1

        );

      }

    }


    /*
     * PRODUCTOS PAGOS
     */

    const productosCompra =
      productosValidados.map(
        producto => ({

          compra_id:
            compra.id,

          producto_id:
            producto.producto_id,

          cantidad:
            producto.cantidad,

          precio_unitario:
            producto.precio_unitario,

          entregado:
            false

        })
      );


    /*
     * PRODUCTOS GRATIS
     */

    const productosGratuitos =
      Array
        .from(
          productosGratis.entries()
        )
        .map(
          ([
            productoId,
            cantidad
          ]) => ({

            compra_id:
              compra.id,

            producto_id:
              productoId,

            cantidad,

            precio_unitario:
              0,

            entregado:
              false

          })
        );


    const todosProductos =
      [
        ...productosCompra,
        ...productosGratuitos
      ];


    if (
      todosProductos.length > 0
    ) {

      const {
        error
      } =
        await this.supabaseService.client
          .from('compra_productos')
          .insert(
            todosProductos
          );


      if (error) {

        await this
          .eliminarCompraFallida(
            compra.id
          );


        return {
          error
        };

      }

    }


    /*
     * MARCAR CANJES
     */

    if (
      idsCanjes.length > 0
    ) {

      const {
        error
      } =
        await this.supabaseService.client
          .rpc(
            'marcar_canjes_utilizados',
            {

              p_compra_id:
                compra.id,

              p_canje_ids:
                idsCanjes

            }
          );


      if (error) {

        await this
          .eliminarCompraFallida(
            compra.id
          );


        return {
          error
        };

      }

    }


    return {

      compra,

      codigo,

      error:
        null

    };

  }


  /*
   * PRECIO NORMAL / PREVENTA
   */

  private obtenerPrecioActual(
    precioNormal: number,
    pelicula: any
  ) {

    if (
      this.estaEnPreventa(
        pelicula
      )
    ) {

      return Number(
        pelicula.precio_preventa
      );

    }


    return precioNormal;

  }


  /*
   * Ventana:
   *
   * estreno - 7 días
   * hasta antes del estreno.
   */

  private estaEnPreventa(
    pelicula: any
  ) {

    if (
      !pelicula?.preventa_activa
      ||
      !pelicula?.fecha_estreno
      ||
      Number(
        pelicula?.precio_preventa
        ??
        0
      )
      <=
      0
    ) {

      return false;

    }


    const ahora =
      new Date();


    const estreno =
      new Date(
        `${pelicula.fecha_estreno}T00:00:00`
      );


    const inicioPreventa =
      new Date(
        estreno
      );


    inicioPreventa.setDate(
      inicioPreventa.getDate()
      -
      7
    );


    return (
      ahora >= inicioPreventa
      &&
      ahora < estreno
    );

  }


  private calcularEdad(
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


  private async eliminarCompraFallida(
    compraId: number
  ) {

    await this.supabaseService.client
      .from('compras')
      .delete()
      .eq(
        'id',
        compraId
      );

  }


  async obtenerMisCompras() {

    const {
      data: sesionData
    } =
      await this.supabaseService.client.auth
        .getSession();


    const usuario =
      sesionData.session?.user;


    if (!usuario) {

      return [];

    }


    const {
      data,
      error
    } =
      await this.supabaseService.client
        .from('compras')
        .select(`
          *,
          entradas (
            id,
            funcion_id,
            codigo_butaca,
            tipo,
            precio,
            validada
          ),
          compra_productos (
            id,
            cantidad,
            precio_unitario,
            entregado,
            productos (
              nombre,
              categoria,
              imagen_url
            )
          )
        `)
        .eq(
          'usuario_id',
          usuario.id
        )
        .order(
          'created_at',
          {
            ascending:
              false
          }
        );


    if (error) {

      console.error(
        error
      );

      return [];

    }


    return data ?? [];

  }


  async buscarCompraPorCodigo(
    codigo: string
  ) {

    const {
      data,
      error
    } =
      await this.supabaseService.client
        .from('compras')
        .select(`
          *,
          entradas (
            id,
            codigo_butaca,
            tipo,
            validada
          ),
          compra_productos (
            id,
            cantidad,
            precio_unitario,
            entregado,
            productos (
              nombre,
              categoria
            )
          )
        `)
        .eq(
          'codigo_qr',
          codigo
        )
        .single();


    if (error) {

      return null;

    }


    return data;

  }


  async validarEntradas(
    compraId: number
  ) {

    return await this.supabaseService.client
      .from('entradas')
      .update({
        validada:
          true
      })
      .eq(
        'compra_id',
        compraId
      )
      .eq(
        'validada',
        false
      );

  }


  async entregarCandy(
    compraId: number
  ) {

    return await this.supabaseService.client
      .from('compra_productos')
      .update({
        entregado:
          true
      })
      .eq(
        'compra_id',
        compraId
      )
      .eq(
        'entregado',
        false
      );

  }


  escucharButacas(
    funcionId: number,
    callback: () => void
  ) {

    return this.supabaseService.client
      .channel(
        `butacas-${funcionId}`
      )
      .on(
        'postgres_changes',

        {
          event:
            '*',

          schema:
            'public',

          table:
            'entradas',

          filter:
            `funcion_id=eq.${funcionId}`
        },

        () => {

          callback();

        }
      )
      .subscribe();

  }

}