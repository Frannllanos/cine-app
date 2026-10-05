import {
  Routes
} from '@angular/router';

import {
  authGuard
} from './core/guards/auth-guard';

import {
  adminGuard
} from './core/guards/admin-guard';

import {
  empleadoGuard
} from './core/guards/empleado-guard';


export const routes:
  Routes = [

  {
    path: '',

    pathMatch:
      'full',

    redirectTo:
      'home'
  },


  {
    path:
      'home',

    loadComponent:
      () =>
        import(
          './features/home/home'
        )
          .then(
            m =>
              m.Home
          )
  },


  {
    path:
      'peliculas',

    loadComponent:
      () =>
        import(
          './features/peliculas/peliculas'
        )
          .then(
            m =>
              m.Peliculas
          )
  },


  {
    path:
      'peliculas/:id',

    loadComponent:
      () =>
        import(
          './features/detalle-pelicula/detalle-pelicula'
        )
          .then(
            m =>
              m.DetallePelicula
          )
  },


  {
    path:
      'proximamente',

    loadComponent:
      () =>
        import(
          './features/proximamente/proximamente'
        )
          .then(
            m =>
              m.Proximamente
          )
  },


  {
    path:
      'mis-peliculas',

    canActivate: [
      authGuard
    ],

    loadComponent:
      () =>
        import(
          './features/mis-peliculas/mis-peliculas'
        )
          .then(
            m =>
              m.MisPeliculas
          )
  },


  {
    path:
      'candy',

    loadComponent:
      () =>
        import(
          './features/candy/candy'
        )
          .then(
            m =>
              m.Candy
          )
  },


  {
    path:
      'compra',

    canActivate: [
      authGuard
    ],

    loadComponent:
      () =>
        import(
          './features/compra/compra'
        )
          .then(
            m =>
              m.Compra
          )
  },


  {
    path:
      'login',

    loadComponent:
      () =>
        import(
          './features/auth/login/login'
        )
          .then(
            m =>
              m.Login
          )
  },


  {
    path:
      'registro',

    loadComponent:
      () =>
        import(
          './features/auth/registro/registro'
        )
          .then(
            m =>
              m.Registro
          )
  },


  {
    path:
      'perfil',

    canActivate: [
      authGuard
    ],

    loadComponent:
      () =>
        import(
          './features/perfil/perfil'
        )
          .then(
            m =>
              m.Perfil
          )
  },


  {
    path:
      'empleado',

    canActivate: [
      authGuard,
      empleadoGuard
    ],

    loadComponent:
      () =>
        import(
          './features/empleado/empleado'
        )
          .then(
            m =>
              m.Empleado
          )
  },


  {
    path:
      'admin',

    canActivate: [
      authGuard,
      adminGuard
    ],

    loadComponent:
      () =>
        import(
          './features/admin/admin'
        )
          .then(
            m =>
              m.Admin
          )
  },


  {
    path:
      'admin/funciones',

    canActivate: [
      authGuard,
      adminGuard
    ],

    loadComponent:
      () =>
        import(
          './features/admin-funciones/admin-funciones'
        )
          .then(
            m =>
              m.AdminFunciones
          )
  },


  {
    path:
      'admin/recompensas',

    canActivate: [
      authGuard,
      adminGuard
    ],

    loadComponent:
      () =>
        import(
          './features/admin-recompensas/admin-recompensas'
        )
          .then(
            m =>
              m.AdminRecompensas
          )
  },


  {
    path:
      '**',

    redirectTo:
      'home'
  }

];