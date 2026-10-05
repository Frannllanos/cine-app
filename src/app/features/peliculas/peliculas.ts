import {
  Component,
  OnInit,
  computed,
  signal
} from '@angular/core';

import {
  FormsModule
} from '@angular/forms';

import {
  RouterLink
} from '@angular/router';

import {
  PeliculaService
} from '../../core/services/pelicula';

import {
  Pelicula
} from '../../core/models/pelicula.interface';


@Component({
  selector: 'app-peliculas',

  imports: [
    FormsModule,
    RouterLink
  ],

  templateUrl:
    './peliculas.html',

  styleUrl:
    './peliculas.css'
})
export class Peliculas
  implements OnInit {

  peliculas =
    signal<Pelicula[]>([]);


  busqueda =
    signal('');


  generoSeleccionado =
    signal('todos');


  generosDisponibles =
    computed(
      () => {

        const generos =
          this.peliculas()
            .flatMap(
              pelicula =>
                pelicula.generos
                ??
                []
            )
            .map(
              genero =>
                genero.trim()
            )
            .filter(
              genero =>
                genero.length > 0
            );


        return [
          ...new Set(
            generos
          )
        ].sort(
          (
            a,
            b
          ) =>
            a.localeCompare(
              b
            )
        );

      }
    );


  peliculasFiltradas =
    computed(
      () => {

        const texto =
          this.busqueda()
            .trim()
            .toLowerCase();


        const genero =
          this.generoSeleccionado();


        return this.peliculas()
          .filter(
            pelicula => {

              const coincideTexto =
                !texto
                ||
                pelicula.nombre
                  .toLowerCase()
                  .includes(
                    texto
                  )
                ||
                pelicula.sinopsis
                  .toLowerCase()
                  .includes(
                    texto
                  );


              const coincideGenero =
                genero
                ===
                'todos'
                ||
                (
                  pelicula.generos
                  ??
                  []
                ).some(
                  item =>
                    item
                      .toLowerCase()
                    ===
                    genero
                      .toLowerCase()
                );


              return (
                coincideTexto
                &&
                coincideGenero
              );

            }
          );

      }
    );


  constructor(
    private peliculaService:
      PeliculaService
  ) {}


  async ngOnInit() {

    this.peliculas.set(
      await this.peliculaService
        .obtenerPeliculasCartelera()
    );

  }


  actualizarBusqueda(
    valor: string
  ) {

    this.busqueda.set(
      valor
    );

  }


  actualizarGenero(
    valor: string
  ) {

    this.generoSeleccionado.set(
      valor
    );

  }


  limpiarFiltros() {

    this.busqueda.set('');

    this.generoSeleccionado.set(
      'todos'
    );

  }

}