import {
  Component
} from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  Router,
  RouterLink
} from '@angular/router';

import {
  AuthService
} from '../../../core/services/auth';


@Component({
  selector: 'app-registro',
  imports: [
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './registro.html',
  styleUrl: './registro.css'
})
export class Registro {

  mensaje = '';


  formulario;


  constructor(

    private fb:
      FormBuilder,

    private authService:
      AuthService,

    private router:
      Router

  ) {

    this.formulario =
      this.fb.group({

        nombre: [
          '',
          Validators.required
        ],

        apellido: [
          '',
          Validators.required
        ],

        email: [
          '',
          [
            Validators.required,
            Validators.email
          ]
        ],

        fecha_nacimiento: [
          '',
          Validators.required
        ],

        tipo_sangre: [
          '',
          Validators.required
        ],

        color_ojos: [
          '',
          Validators.required
        ],

        dias_vacaciones: [
          0,
          [
            Validators.required,
            Validators.min(0)
          ]
        ],

        password: [
          '',
          [
            Validators.required,
            Validators.minLength(6)
          ]
        ]

      });

  }


  async registrar() {

    if (
      this.formulario.invalid
    ) {

      this.mensaje =
        'Completá todos los campos correctamente.';

      return;

    }


    const valores =
      this.formulario
        .getRawValue();


    const {
      error
    } =
      await this.authService
        .registrar(

          valores.email!,

          valores.password!,

          valores.nombre!,

          valores.apellido!,

          valores.fecha_nacimiento!,

          valores.tipo_sangre!,

          valores.color_ojos!,

          Number(
            valores.dias_vacaciones
          )

        );


    if (error) {

      console.error(
        error
      );

      this.mensaje =
        error.message;

      return;

    }


    this.mensaje =
      'Usuario registrado correctamente';


    setTimeout(
      () => {

        this.router.navigate([
          '/login'
        ]);

      },
      1000
    );

  }

}