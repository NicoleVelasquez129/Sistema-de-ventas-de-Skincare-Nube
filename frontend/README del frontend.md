# 🎨 Skinker Nube — Frontend

Aplicación web de la tienda **Nube**: catálogo en línea con canastita para el cliente, caja y pedidos en línea para el vendedor, y paneles de ventas y gestión para el administrador. Se conecta al backend mediante una API REST.

Está construida con **React + TypeScript + Vite**, con estilos de **Tailwind CSS 3** y **DaisyUI 4**, y se adapta a celular y laptop.

---

## 📋 Tabla de contenido

1. [Descripción](#-1-descripción)
2. [Tecnologías](#-2-tecnologías)
3. [Estructura del proyecto](#-3-estructura-del-proyecto)
4. [Instalación y scripts](#-4-instalación-y-scripts)
5. [Configuración](#-5-configuración)
6. [Rutas y roles](#-6-rutas-y-roles)
7. [Pantallas y módulos](#-7-pantallas-y-módulos)
8. [Sesión y seguridad en el cliente](#-8-sesión-y-seguridad-en-el-cliente)
9. [Formularios y validaciones](#-9-formularios-y-validaciones)
10. [Diseño](#-10-diseño)
11. [Comunicación con la API](#-11-comunicación-con-la-api)
12. [Problemas frecuentes](#-12-problemas-frecuentes)
13. [Metas a futuro](#-13-metas-a-futuro)

---

## 🚀 1. Descripción

| Rol | Pantallas |
|---|---|
| Visitante | Catálogo, inicio de sesión, crear cuenta, recuperar contraseña. |
| Cliente | Catálogo, canastita, **Mis pedidos**. |
| Vendedor | **Vender** (caja) y **Pedidos en línea**. |
| Administrador | **Ventas** (panel de ganancias) y **Gestión** (productos, categorías, vendedores y reportes). |

---

## 🛠️ 2. Tecnologías

| Tecnología | Uso |
|---|---|
| **React 19** | Interfaz basada en componentes |
| **TypeScript** | Tipado estático |
| **Vite** | Servidor de desarrollo y compilación |
| **React Router DOM 7** | Navegación y rutas protegidas |
| **Tailwind CSS 3 + DaisyUI 4** | Estilos y componentes |
| **Fetch API** | Consumo de la API REST |
| **oxlint** | Revisión de código (`npm run lint`) |

---

## 📂 3. Estructura del proyecto

```text
frontend/
├── README.md
├── package.json
├── tailwind.config.js             # Colores de la marca y tema DaisyUI "nube"
├── vite.config.ts · tsconfig*.json · index.html
└── src/
    ├── main.tsx                   # Punto de entrada
    ├── App.tsx                    # Rutas, sesión y carrito
    ├── index.css · App.css        # Estilos globales
    ├── interfaces/
    │   └── index.ts               # Tipos: Producto, Categoria, Cliente, CartItem…
    ├── services/
    │   ├── authService.ts         # Login, registro, recuperación y sesión
    │   └── apiService.ts          # Resto de llamadas a la API
    ├── components/
    │   ├── Navbar.tsx             # Menú según el rol
    │   ├── Canastita.tsx          # Carrito lateral y pago
    │   ├── QrPagoFalso.tsx        # QR de pago simulado
    │   ├── UIFeedback.tsx         # Mensajes flotantes (carga, éxito, error)
    │   ├── auth/
    │   │   └── CampoContrasena.tsx    # Campo de contraseña con ojito y aviso único
    │   └── admin/
    │       ├── ProductosAdmin.tsx
    │       ├── CategoriasAdmin.tsx
    │       ├── VendedoresAdmin.tsx
    │       └── ReportesAdmin.tsx
    └── pages/
        ├── Catalogo.tsx           # Inicio y catálogo
        ├── Login.tsx              # Ingresar, crear cuenta y olvidé mi contraseña
        ├── RestablecerContrasena.tsx
        ├── MisPedidos.tsx         # Cliente
        ├── Vender.tsx             # Vendedor: caja
        ├── PedidosEnLinea.tsx     # Vendedor: pedidos web
        ├── Ventas.tsx             # Administrador: panel de ventas
        └── Gestion.tsx            # Administrador: pestañas de gestión
```

---

## ⚙️ 4. Instalación y scripts

**Requisitos:** Node.js 18+ y el **backend funcionando** en `http://localhost:3000`.

```bash
git clone https://github.com/NicoleVelasquez129/Sistema-ventas.git
cd Sistema-ventas/frontend
npm install
npm run dev
```

La aplicación abre en `http://localhost:5173`.

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga automática. |
| `npm run build` | Revisa los tipos (`tsc -b`) y genera la versión de producción en `dist/`. |
| `npm run preview` | Sirve la versión compilada para probarla. |
| `npm run lint` | Revisa el código con oxlint. |

---

## 🔧 5. Configuración

**URL de la API.** Está escrita directamente en el código, en **dos archivos**:

| Archivo | Constante |
|---|---|
| `src/services/authService.ts` | `API_URL = 'http://localhost:3000/api'` |
| `src/services/apiService.ts` | `API_URL = 'http://localhost:3000/api'` |

Para usar otro servidor, cambia el valor en **ambos** archivos. El backend debe tener `FRONTEND_URL` igual al origen del frontend, porque si no el navegador bloquea las peticiones por CORS.

**Colores de la marca** (`tailwind.config.js`):

| Nombre | Valor | Uso |
|---|---|---|
| `primary` | `#68c3b7` | Color principal (botones, encabezados de paneles) |
| `primaryFocus` | `#55a89e` | Estado al pasar el mouse |
| `nube-oscuro` | `#0f766e` | Textos de acento |
| `nube-suave` | `#5bb3a9` | Apoyo |
| `nube-crema` | `#fdfbf7` | Fondos suaves |

---

## 🧭 6. Rutas y roles

| Ruta | Pantalla | Acceso |
|---|---|---|
| `/` | Catálogo | Todos |
| `/login` | Ingresar, crear cuenta, recuperar contraseña | Todos |
| `/restablecer?token=…` | Elegir nueva contraseña | Todos (con el enlace del correo) |
| `/mis-pedidos` | Mis pedidos | Usuario con sesión |
| `/vender` | Caja | Vendedor |
| `/pedidos-en-linea` | Pedidos en línea | Vendedor |
| `/ventas` | Panel de ventas | Administrador |
| `/gestion` | Productos, categorías, vendedores y reportes | Administrador |
| cualquier otra | Redirige a `/` | — |

Si el usuario no tiene el rol necesario, la aplicación lo envía a `/login`. Esto mejora la experiencia, pero **la seguridad real la aplica el backend** en cada petición.

El menú (`Navbar`) muestra enlaces distintos según el rol: Cliente → *Mis pedidos*; Vendedor → *Vender* y *Pedidos en línea*; Administrador → *Ventas* y *Gestión*.

---

## 🖥️ 7. Pantallas y módulos

### 7.1 Catálogo (`/`)
- Lista de productos en tarjetas, con imagen, nombre, categoría, precio y stock.
- **Búsqueda** por nombre o código.
- **Categorías** en píldoras. Si hay más de 5, se muestran las primeras 4 y el resto va en el menú **Más categorías**.
- Al abrir un producto se ve el **detalle**: imagen completa, ingredientes y modo de uso, y se puede agregar al carrito.

### 7.2 Canastita
- Panel lateral con los productos, cantidades (+/−) y papelera.
- **Envío gratis desde Bs 100**; la barra de progreso muestra cuánto falta. Por debajo se cobra Bs 15.
- Obliga a poner **dirección escrita**, **ubicación actual** (botón con GPS) o ambas.
- **Proceder al Pago** exige sesión: si no la hay, el carrito se guarda y se recupera al ingresar. Al confirmar, muestra un **QR de pago simulado**.

### 7.3 Login (`/login`)
Tres vistas en una: **Ingresar**, **Crear cuenta** (nombre, correo, **celular**, contraseña y repetirla) y **Recuperar contraseña**.

### 7.4 Mis pedidos (`/mis-pedidos`)
- Lista de compras con su estado: *Falta tu comprobante*, *Comprobante en revisión*, *Pagado*, *Enviado* o *Anulado*.
- **Enviar comprobante** (imagen o PDF, máx. 5 MB) y **Ver comprobante**.
- Si el vendedor rechaza el pago, se muestra su mensaje y se puede enviar otro comprobante.
- **Descargar ticket PDF** disponible solo cuando el pago ya fue confirmado.

### 7.5 Vender (`/vender`) — caja
- Búsqueda de producto, selección y cantidades con control de stock.
- **Cliente:** carnet opcional con botón *Buscar*. Si existe, se rellenan los datos y el vendedor debe **confirmarlos**; si no, llena los datos normalmente.
- Opción **El cliente ya pagó** con método de pago (efectivo, QR o transferencia), o dejar la venta pendiente.
- **Mis ventas:** tarjetas de resumen (ventas, total vendido, cobrado y por cobrar) y tabla con **Confirmar pago** y **Ticket**.

### 7.6 Pedidos en línea (`/pedidos-en-linea`) — vendedor
- Pedidos web con productos, dirección o ubicación y comprobante (imagen o PDF).
- **Confirmar pago** (con diálogo de confirmación propio), **Enviar mensaje al cliente** si el pago no llegó y **marcar como enviado**.

### 7.7 Ventas (`/ventas`) — administrador
- Periodos: este mes, mes, año o rango de fechas; filtro por categoría.
- Tarjetas de resumen, incluida **Ganancia** (precio menos costo, sin envío).
- Gráfico de **ingresos por día o por mes**, **más vendidos** (por unidades o ingresos) y **productos con poca o ninguna venta**.

### 7.8 Gestión (`/gestion`) — administrador
Cuatro pestañas:
- **Productos:** crear, editar, activar/desactivar, subir imagen desde el celular o la laptop, mover varios a otra categoría y eliminar.
- **Categorías:** crear, editar y eliminar (no se elimina una con productos).
- **Vendedores:** crear, activar/desactivar y **Ver ventas** de cada uno con filtro por fechas.
- **Reportes:** ventas, ganancias e inventario; se ve primero la tabla en pantalla y luego se descarga en **PDF** o **Excel**.

---

## 🔒 8. Sesión y seguridad en el cliente

- Tras el login, el token y los datos del usuario se guardan en `localStorage` (`skinker_token` y `skinker_usuario`).
- Antes de usarlo, se **revisa la fecha de vencimiento** del token; si venció, la sesión se cierra automáticamente.
- Cada petición protegida envía `Authorization: Bearer <token>`.
- **Cerrar sesión** borra los datos locales.
- Los textos se muestran con React (que escapa el contenido) y no se usa `dangerouslySetInnerHTML`.

---

## 📝 9. Formularios y validaciones

- Los formularios usan `noValidate`: la validación la hace la propia aplicación y no los globos del navegador.
- Los avisos de error salen **pequeños y en rojo, debajo del campo** correspondiente.
- `autoComplete="off"` en los campos de datos para que el navegador no rellene datos ajenos; en contraseñas se usan `current-password` y `new-password`.
- `CampoContrasena` muestra **un solo texto** bajo el campo: la ayuda en gris, que se vuelve el error en rojo si hay un problema.
- Reglas de contraseña: mínimo 8 caracteres, con letras y números.
- Los errores que vienen del servidor (por ejemplo, stock insuficiente) se muestran en un aviso general.

---

## 🎨 10. Diseño

- **Tailwind CSS 3** para los estilos y **DaisyUI 4** con el tema personalizado `nube`.
- Se mantiene el color principal en todos los paneles y se usa una tipografía serif para los títulos.
- Diseño **responsive**: menús, tablas con desplazamiento horizontal y modales que funcionan en celular.
- Mensajes flotantes (`UIFeedback`) para carga, éxito y error, y diálogos propios en lugar de `confirm()` del navegador.

---

## 🔌 11. Comunicación con la API

Todas las llamadas están centralizadas en `src/services/`:

| Archivo | Funciones principales |
|---|---|
| `authService.ts` | `loginAPI`, `registroAPI`, `olvideContrasenaAPI`, restablecer contraseña, manejo de sesión y `cabecerasAuth`. |
| `apiService.ts` | Productos, categorías, clientes y carnet, ventas (en línea y de tienda), pagos, comprobantes, pedidos en línea, vendedores, facturas PDF y reportes. |

Además, `urlImagen(ruta)` convierte las rutas `/uploads/...` del backend en URLs completas.

---

## 🩺 12. Problemas frecuentes

| Síntoma | Causa probable | Solución |
|---|---|---|
| "Error de conexión con el servidor" | Backend apagado o `API_URL` incorrecta. | Inicia el backend y revisa `API_URL` en los dos servicios. |
| Error de CORS en la consola | `FRONTEND_URL` del backend distinto al origen del frontend. | Ajusta `FRONTEND_URL` en el `.env` del backend y reinícialo. |
| Me devuelve a `/login` | Sesión vencida o rol sin permiso. | Inicia sesión de nuevo con el rol correcto. |
| No cargan las imágenes | El backend no sirve `/uploads` o la ruta cambió. | Verifica que el backend esté activo y vuelve a subir la imagen. |
| Cambios de estilo no se ven | Caché de Vite. | Detén y vuelve a iniciar `npm run dev`. |

---

## 🔭 13. Metas a futuro

- Mover la URL de la API a una variable de entorno de Vite (`VITE_API_URL`).
- Pantalla de **notificaciones** del pedido (depende del Paso 6 del backend).
- Convertir la aplicación en **PWA** (instalable y con caché).
- Pruebas automatizadas de componentes y de flujos.
- Despliegue en producción.