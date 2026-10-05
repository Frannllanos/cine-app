import {
  Component,
  OnInit,
  signal
} from '@angular/core';

import { ProductoService } from '../../core/services/producto';

import { Producto } from '../../core/models/producto.interface';


@Component({
  selector: 'app-candy',
  imports: [],
  templateUrl: './candy.html',
  styleUrl: './candy.css'
})
export class Candy implements OnInit {

  productos =
    signal<Producto[]>([]);


  constructor(
    private productoService: ProductoService
  ) {}


  async ngOnInit() {

    this.productos.set(
      await this.productoService
        .obtenerProductos()
    );

  }

}