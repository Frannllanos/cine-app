import {
  Injectable
} from '@angular/core';

import {
  SupabaseService
} from './supabase';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private supabaseService:
      SupabaseService
  ) {}


  async registrar(

    email: string,

    password: string,

    nombre: string,

    apellido: string,

    fechaNacimiento: string,

    tipoSangre: string,

    colorOjos: string,

    diasVacaciones: number

  ) {

    return await this.supabaseService.client.auth
      .signUp({

        email,

        password,

        options: {

          data: {

            nombre,

            apellido,

            fecha_nacimiento:
              fechaNacimiento,

            tipo_sangre:
              tipoSangre,

            color_ojos:
              colorOjos,

            dias_vacaciones:
              diasVacaciones

          }

        }

      });

  }


  async iniciarSesion(
    email: string,
    password: string
  ) {

    return await this.supabaseService.client.auth
      .signInWithPassword({

        email,

        password

      });

  }


  async cerrarSesion() {

    return await this.supabaseService.client.auth
      .signOut();

  }


  async obtenerSesion() {

    const {
      data
    } =
      await this.supabaseService.client.auth
        .getSession();


    return data.session;

  }


  async obtenerPerfil() {

    const sesion =
      await this.obtenerSesion();


    if (!sesion) {

      return null;

    }


    const {
      data,
      error
    } =
      await this.supabaseService.client
        .from('profiles')
        .select('*')
        .eq(
          'id',
          sesion.user.id
        )
        .single();


    if (error) {

      console.error(
        error
      );

      return null;

    }


    return data;

  }


  escucharCambiosSesion(
    callback: () => void
  ) {

    return this.supabaseService.client.auth
      .onAuthStateChange(
        () => {

          callback();

        }
      );

  }

}