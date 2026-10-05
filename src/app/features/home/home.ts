import {
  Component,
  OnInit,
  signal
} from '@angular/core';

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
  selector: 'app-home',

  imports: [
    RouterLink
  ],

  templateUrl:
    './home.html',

  styleUrl:
    './home.css'
})
export class Home
  implements OnInit {

  topPeliculas =
    signal<
      (
        Pelicula
        & {
          ventas?: number;
        }
      )[]
    >([]);


  constructor(
    private peliculaService:
      PeliculaService
  ) {}


  async ngOnInit() {

    this.topPeliculas.set(
      await this.peliculaService
        .obtenerTopVendidas()
    );

  }

}