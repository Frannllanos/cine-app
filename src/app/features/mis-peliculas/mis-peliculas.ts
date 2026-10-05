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
  MisPeliculasService,
  PeliculaVista
} from '../../core/services/mis-peliculas';


@Component({
  selector:
    'app-mis-peliculas',

  imports: [
    DatePipe,
    RouterLink
  ],

  templateUrl:
    './mis-peliculas.html',

  styleUrl:
    './mis-peliculas.css'
})
export class MisPeliculas
  implements OnInit {

  peliculas =
    signal<PeliculaVista[]>([]);


  cargando =
    signal(true);


  constructor(
    private misPeliculasService:
      MisPeliculasService
  ) {}


  async ngOnInit() {

    this.peliculas.set(
      await this.misPeliculasService
        .obtenerMisPeliculas()
    );


    this.cargando.set(
      false
    );

  }


  estrellas(
    puntuacion:
      number | null
  ) {

    if (!puntuacion) {

      return '☆☆☆☆☆';

    }


    const cantidad =
      Math.max(
        0,
        Math.min(
          5,
          Math.round(
            puntuacion
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

}