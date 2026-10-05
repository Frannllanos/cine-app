import {
  inject
} from '@angular/core';

import {
  CanActivateFn,
  Router
} from '@angular/router';

import {
  AuthService
} from '../services/auth';


export const empleadoGuard:
  CanActivateFn =
  async () => {

    const authService =
      inject(
        AuthService
      );


    const router =
      inject(
        Router
      );


    const perfil =
      await authService
        .obtenerPerfil();


    if (
      perfil?.rol === 'empleado'
      ||
      perfil?.rol === 'admin'
    ) {

      return true;

    }


    return router
      .createUrlTree([
        '/home'
      ]);

  };