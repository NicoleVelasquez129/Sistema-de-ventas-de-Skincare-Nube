# Frontend - Skinker Nube

Este proyecto corresponde al frontend de la aplicacion web de ventas y gestion de skincare desarrollada en el marco de la materia Tecnologia Web II. La interfaz permite administrar productos, clientes, categorias, ventas y acceso por roles, conectandose con el backend mediante una API REST.

La app fue construida en React + TypeScript con Vite y presenta una interfaz moderna, sobria y adaptativa para gestionar operaciones de negocio de una tienda de cuidado personal.

## Descripcion general

El frontend tiene como objetivo centralizar todas las operaciones visibles para el usuario final:

- autenticacion de usuarios
- navegacion por secciones
- visualizacion del catalogo de productos
- registro de ventas con validaciones
- gestion de clientes y categorias
- mensajes de estado y feedback visual
- control de acceso por tipo de usuario

## Tecnologias utilizadas

- React 19
- TypeScript
- Vite
- React Router DOM
- CSS moderno con estilos inline
- Fetch API para consumo de servicios REST

## Estructura del proyecto

```text
frontend/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── Navbar.tsx
│   │   └── UIFeedback.tsx
│   ├── interfaces/
│   │   └── index.ts
│   ├── pages/
│   │   ├── Catalogo.tsx
│   │   ├── Gestion.tsx
│   │   ├── Login.tsx
│   │   └── Ventas.tsx
│   ├── services/
│   │   ├── apiService.ts
│   │   └── authService.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── README FRONT.md
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .gitignore
```

## Modulos principales

### Login y autenticacion

La aplicacion cuenta con un flujo de autenticacion completo a traves de la vista Login.

- ingreso de correo y contraseña
- validacion de campos
- llamada al backend mediante loginAPI
- almacenamiento del token y del usuario en localStorage
- validacion de expiracion del JWT
- cierre de sesion con limpieza de datos locales

### Catalogo de productos

La vista principal del sistema es el catalogo.

Funciones actuales:

- carga de productos desde el backend
- busqueda por nombre
- listado en tarjetas con imagen, nombre, categoria, precio y stock
- seleccion de producto para ver detalles
- compra directa desde el detalle del producto
- validacion de stock antes de registrar la venta
- modal para editar producto
- actualizacion del stock y datos del producto

### Modulo de ventas

La vista Ventas permite registrar transacciones de forma simple y validada.

- seleccion de cliente
- seleccion de producto
- validacion de cantidad
- envio de la venta al backend
- actualizacion del inventario
- mensajes de exito o error

### Gestion de clientes y categorias

La vista Gestion incluye dos secciones:

- clientes: registrar nombre, telefono y correo
- categorias: registrar nombre y descripcion
- listado de datos ya cargados

### Feedback visual

El componente UIFeedback muestra mensajes flotantes de:

- carga
- error
- exito

Esto mejora la experiencia del usuario en todas las operaciones.

## Routing actual

La aplicacion usa BrowserRouter y tiene las rutas:

```text
/
/login
/ventas
/gestion
```

## Servicios de API

La capa de servicios esta centralizada en `src/services/apiService.ts`.

Funciones clave:

- obtenerProductosAPI
- obtenerClientesAPI
- obtenerCategoriasAPI
- registrarVentaAPI
- crearClienteAPI
- crearCategoriaAPI
- actualizarProductoAPI

## Instalacion y ejecucion

```bash
cd frontend
npm install
npm run dev
```

La app normalmente se abre en:

```text
http://localhost:5173
```

## Build de produccion

```bash
npm run build
```

## Roles y permisos

- administrador: acceso a ventas y gestion
- cliente: acceso al catalogo y flujo de compra

## Estado actual del proyecto

El frontend ya incluye:

- autenticacion con JWT
- login funcional
- proteccion de rutas por rol
- catalogo de productos
- compras con validacion de stock
- registro de ventas
- alta de clientes
- alta de categorias
- edicion de productos
- feedback visual para errores y mensajes de exito
- interfaz responsiva

## Nota importante

Este frontend depende de que el backend de Skinker Nube este ejecutandose correctamente en:

```text
http://localhost:3000/api
```

Si el backend no esta activo, muchas operaciones no funcionaran.