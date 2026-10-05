import {
  Component,
  OnInit,
  signal
} from '@angular/core';

import {
  Router,
  RouterLink,
  RouterLinkActive
} from '@angular/router';

import { AuthService } from '../../core/services/auth';


@Component({
  selector: 'app-header',
  imports: [
    RouterLink,
    RouterLinkActive
  ],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header implements OnInit {

  logueado =
    signal(false);

  rol =
    signal<string | null>(null);


  constructor(
    private authService: AuthService,
    private router: Router
  ) {}


  async ngOnInit() {

    await this.cargarUsuario();


    this.authService
      .escucharCambiosSesion(
        async () => {

          await this.cargarUsuario();

        }
      );

  }


  async cargarUsuario() {

    const sesion =
      await this.authService
        .obtenerSesion();


    if (!sesion) {

      this.logueado.set(false);

      this.rol.set(null);

      return;

    }


    this.logueado.set(true);


    const perfil =
      await this.authService
        .obtenerPerfil();


    this.rol.set(
      perfil?.rol ?? 'cliente'
    );

  }


  async cerrarSesion() {

    await this.authService
      .cerrarSesion();


    this.logueado.set(false);

    this.rol.set(null);


    this.router.navigate([
      '/home'
    ]);

  }

}