# 🎬 Cine App

Trabajo Práctico 1 de **Programación IV**.

Aplicación web para la gestión de un cine desarrollada con **Angular** y **Supabase**. El sistema incluye cartelera, funciones, compra de entradas, selección de butacas, Candy Bar, roles de usuario, reseñas, fidelización, preventa y herramientas de administración.

## 🌐 Deploy

**Aplicación:**  
https://effervescent-starlight-dd36c1.netlify.app

**Repositorio:**  
https://github.com/Frannllanos/cine-app

## 🛠️ Tecnologías utilizadas

- Angular 22
- TypeScript
- HTML y CSS
- Angular Router
- Reactive Forms
- Angular Signals
- Supabase
- PostgreSQL
- Supabase Authentication
- Supabase Storage
- Supabase Realtime
- Row Level Security
- Angular PWA / Service Worker
- jsPDF
- QRCode
- Netlify

## 🧱 Arquitectura

El proyecto se organizó separando responsabilidades entre componentes, servicios, modelos y guards.

```text
src/app/
├── core/
│   ├── guards/
│   ├── models/
│   └── services/
├── features/
│   ├── admin/
│   ├── admin-funciones/
│   ├── admin-recompensas/
│   ├── auth/
│   ├── candy/
│   ├── compra/
│   ├── detalle-pelicula/
│   ├── empleado/
│   ├── home/
│   ├── mis-peliculas/
│   ├── peliculas/
│   ├── perfil/
│   └── proximamente/
├── layout/
│   ├── header/
│   └── footer/
└── shared/
    └── components/
```

La comunicación principal sigue el esquema:

```text
Componente → Servicio → Supabase → PostgreSQL
```

Los componentes se encargan principalmente de la interfaz y la interacción con el usuario, mientras que los servicios concentran el acceso a datos y lógica reutilizable.

## ⚙️ Decisiones técnicas

### Angular

Se utilizó Angular como framework frontend, trabajando con componentes standalone, routing, guards, formularios reactivos, signals y lazy loading mediante `loadComponent`.

### Supabase

Supabase funciona como backend de la aplicación y centraliza:

- Base de datos PostgreSQL.
- Autenticación y sesiones.
- Storage para imágenes.
- Realtime para actualizar el estado de las butacas.
- RLS para controlar el acceso a los datos.
- Funciones RPC para parte de la lógica de negocio.

### Roles y seguridad

El sistema contempla tres roles:

- Cliente.
- Empleado.
- Administrador.

Angular Guards controlan el acceso a las rutas según autenticación y rol. La seguridad de los datos se complementa con políticas y funciones en Supabase.

### Reglas de negocio

Algunas reglas importantes se respaldan desde la base de datos y no solamente desde el frontend, por ejemplo:

- Evitar superposición de funciones en una misma sala.
- Mantener un margen de 30 minutos entre funciones.
- Evitar vender dos veces la misma butaca para una misma función.
- Controlar operaciones relacionadas con roles, compras y cancelaciones.

### Realtime

Supabase Realtime se utiliza para mantener actualizada la disponibilidad de butacas cuando varios usuarios interactúan con una misma función.

### PWA

La aplicación incorpora soporte PWA mediante Angular Service Worker.

El proyecto contiene:

- `manifest.webmanifest`
- `ngsw-config.json`
- Iconos PWA
- Service Worker generado durante el build de producción

### QR y PDF

Al confirmar una compra se genera un código identificador. La librería `qrcode` convierte ese código en un QR visible para el usuario.

La librería `jsPDF` se utiliza para generar el comprobante PDF de la compra, incorporando información básica y el QR correspondiente.

El empleado puede validar la compra mediante el código asociado y el sistema controla su estado para evitar reutilizaciones.

### Deploy

La aplicación se compila con:

```bash
ng build
```

El resultado de producción se genera en:

```text
dist/cine-app/browser
```

y se publica en Netlify.

## ✅ Funcionalidades principales

- Registro, login y cierre de sesión.
- Roles cliente, empleado y administrador.
- Cartelera de películas.
- Buscador y filtro por género.
- Detalle de película.
- Reseñas y puntuación promedio.
- Gestión de películas.
- Gestión de productos de Candy Bar.
- Gestión de combos y cupones.
- Gestión de recompensas.
- Creación de funciones.
- Asignación automática de salas.
- Control de superposición de funciones.
- Selección de butacas.
- Butacas accesibles y VIP.
- Disponibilidad de butacas mediante Realtime.
- Restricciones de edad para usuarios registrados.
- Compra de entradas y productos.
- Sistema de puntos y canjes.
- Cancelación de compras con crédito.
- Sección Próximamente.
- Preventa.
- Alertas.
- Sección Mis películas.
- Generación de QR.
- Validación manual de códigos por empleados.
- Generación de PDF.
- Soporte PWA.

## ▶️ Ejecución local

Clonar el repositorio:

```bash
git clone https://github.com/Frannllanos/cine-app.git
```

Entrar al proyecto:

```bash
cd cine-app
```

Instalar dependencias:

```bash
npm install
```

Ejecutar:

```bash
ng serve
```

La aplicación estará disponible en:

```text
http://localhost:4200
```

## 👨‍💻 Autor

**Francisco Joaquín Llanos**  
Programación IV - 2026
