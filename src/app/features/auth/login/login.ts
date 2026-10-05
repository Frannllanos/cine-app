import { Component } from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import {
  Router,
  RouterLink
} from '@angular/router';

import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  mensaje = '';

  formulario;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {

    this.formulario = this.fb.group({

      email: [
        '',
        [
          Validators.required,
          Validators.email
        ]
      ],

      password: [
        '',
        Validators.required
      ]

    });

  }

  async iniciarSesion() {

    if (this.formulario.invalid) {
      return;
    }

    const valores =
      this.formulario.getRawValue();

    const { error } =
      await this.authService.iniciarSesion(
        valores.email!,
        valores.password!
      );

    if (error) {

      this.mensaje = 'Email o contraseña incorrectos';
      return;

    }

    this.router.navigate(['/home']);

  }

}