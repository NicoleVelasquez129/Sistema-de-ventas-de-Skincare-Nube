# ☁️ Skinker Nube — Backend (API REST)

API REST del sistema de ventas de la tienda Nube: **productos, categorías, clientes, usuarios, ventas, pagos, pedidos en línea y reportes**.

Está desarrollada con **Node.js + Express + Sequelize + MySQL**, con una arquitectura **MVC + Services** que separa las responsabilidades y mantiene la integridad de las operaciones de venta.

---

## 📋 Tabla de contenido

1. [Descripción](#-1-descripción)
2. [Arquitectura](#-2-arquitectura)
3. [Tecnologías](#-3-tecnologías)
4. [Estructura del proyecto](#-4-estructura-del-proyecto)
5. [Instalación y puesta en marcha](#-5-instalación-y-puesta-en-marcha)
6. [Variables de entorno](#-6-variables-de-entorno)
7. [Base de datos](#-7-base-de-datos)
8. [Autenticación y roles](#-8-autenticación-y-roles)
9. [Endpoints de la API](#-9-endpoints-de-la-api)
10. [Formato de respuestas y errores](#-10-formato-de-respuestas-y-errores)
11. [Reglas de negocio](#-11-reglas-de-negocio)
12. [Seguridad](#-12-seguridad)
13. [Archivos subidos, correo y reportes](#-13-archivos-subidos-correo-y-reportes)
14. [Pruebas](#-14-pruebas)
15. [Problemas frecuentes](#-15-problemas-frecuentes)
16. [Metas a futuro](#-16-metas-a-futuro)

---

## 🚀 1. Descripción

La API permite:

- 📦 Administrar **productos** (con imagen, ingredientes, modo de uso, costo y stock) y **categorías**.
- 👥 Gestionar **clientes** y **usuarios** con tres roles: administrador, vendedor y cliente.
- 🛒 Registrar **ventas** de tienda (vendedor) y **compras en línea** (cliente) con control de stock transaccional.
- 💳 Registrar **pagos** (efectivo, QR, transferencia) y recibir **comprobantes** de pago.
- 🚚 Seguir el **estado del pedido**: pendiente → pagado → enviado.
- 🧾 Generar **tickets/facturas en PDF**.
- 📈 Entregar **reportes** de ventas, ganancias e inventario en **PDF y Excel**.

---

## 🏗️ 2. Arquitectura

```text
Cliente (frontend)
   │  HTTP + JSON (Authorization: Bearer <token>)
   ▼
Routes        → definen los endpoints y los middlewares de cada uno
   ▼
Controllers   → leen la petición y devuelven la respuesta HTTP
   ▼
Services      → lógica de negocio, validaciones y transacciones
   ▼
Models        → Sequelize ORM
   ▼
MySQL
```

| Capa | Responsabilidad |
|---|---|
| **Routes** | Asociar cada endpoint con su controlador y aplicar `verificarToken`, `soloAdmin`, `adminOVendedor`, `validateId`. |
| **Controllers** | Recibir `req`, invocar al servicio y responder con el código HTTP correcto. No contienen la lógica del negocio. |
| **Services** | Validar datos, calcular totales, verificar stock, confirmar pagos y manejar transacciones. |
| **Models** | Definir tablas, atributos y relaciones con Sequelize. |
| **Middlewares** | Autenticación y roles, validación de IDs y subida de archivos. |

---

## 🛠️ 3. Tecnologías

| Tecnología | Uso |
|---|---|
| **Node.js** (18+) | Entorno de ejecución |
| **Express 5** | Framework de la API |
| **Sequelize 6 + mysql2** | ORM y conexión a MySQL |
| **MySQL 8.0.16+** | Base de datos relacional |
| **jsonwebtoken** | Sesiones con JWT (HS256) |
| **bcryptjs** | Cifrado de contraseñas |
| **helmet / cors / express-rate-limit** | Cabeceras seguras, CORS y límite de intentos |
| **multer** | Subida de imágenes y comprobantes |
| **nodemailer** | Correo de recuperación de contraseña |
| **pdfkit / exceljs** | Tickets y reportes en PDF y Excel |
| **dotenv** | Variables de entorno |
| **Postman / Thunder Client** | Pruebas de la API |
| **MySQL Workbench** | Administración de la base de datos |

---

## 📂 4. Estructura del proyecto

```text
backend/
├── server.js                      # Punto de entrada: middlewares, rutas y arranque
├── package.json
├── config/
│   └── database.js                # Conexión Sequelize (lee el .env)
├── database/
│   └── init.sql                   # Script SQL: tablas y datos de ejemplo
├── models/
│   ├── index.js                   # Relaciones entre modelos
│   ├── Categoria.js  Producto.js  Cliente.js  Usuario.js
│   └── Venta.js  DetalleVenta.js  Pago.js
├── routes/
│   ├── authRoutes.js              # /api/auth
│   ├── productRoutes.js           # /api/productos
│   ├── categoryRoutes.js          # /api/categorias
│   ├── clientRoutes.js            # /api/clientes
│   ├── userRoutes.js              # /api/usuarios
│   ├── saleRoutes.js              # /api/ventas
│   ├── uploadRoutes.js            # /api/upload
│   └── reportRoutes.js            # /api/reportes
├── controllers/                   # Un controlador por módulo (+ reportController, uploadController)
├── services/
│   ├── authService.js             # Login, registro y recuperación de contraseña
│   ├── productService.js  categoryService.js  clientService.js  userService.js
│   ├── saleService.js             # Ventas, pagos, cancelación y pedidos en línea
│   ├── reportService.js           # Consultas de los reportes
│   ├── pdfService.js              # Ticket / factura PDF
│   ├── pdfReportService.js        # Reportes en PDF
│   ├── excelService.js            # Reportes en Excel
│   └── emailService.js            # Envío de correos (SMTP)
├── middlewares/
│   ├── auth.js                    # verificarToken, soloAdmin, adminOVendedor, adminSiPideTodos
│   ├── upload.js                  # multer: imágenes y comprobantes
│   └── validateId.js              # Valida que :id sea un entero positivo
├── scripts/
│   ├── crearAdmin.js              # Crea o actualiza el administrador
│   └── crearVendedor.js           # Crea o actualiza un vendedor
└── uploads/                       # Imágenes y comprobantes (se crea sola; no se sube a Git)
```

---

## ⚙️ 5. Instalación y puesta en marcha

**Requisitos:** Node.js 20+, MySQL Server 8.0.16+ y Git. MySQL Workbench es opcional, pero facilita ejecutar `init.sql`.

**1. Clonar e instalar**

```bash
git clone https://github.com/NicoleVelasquez129/Sistema-de-ventas-de-Skincare-Nube.git
cd Sistema-de-ventas-de-Skincare-Nube/backend
npm ci
```

`npm ci` instala las dependencias declaradas en `package-lock.json`, incluidos `exceljs` (Excel) y `pdfkit` (PDF). No hace falta instalarlos por separado.

**2. Crear la base de datos**

Abre `backend/database/init.sql` en MySQL Workbench y ejecútalo **completo, una sola vez**. Crea la base `skinker_nube_db`, las 9 tablas y datos de ejemplo (4 categorías, 5 productos y 2 clientes).

**3. Crear el archivo `.env`**

Copia `backend/.env.example` como `backend/.env` y completa allí los valores de configuración.

**4. Crear los usuarios iniciales**

Los usuarios no vienen en el SQL, porque un hash de ejemplo no permitiría iniciar sesión.

```bash
node scripts/crearAdmin.js      # correo, contraseña (mínimo 8) y nombre
node scripts/crearVendedor.js   # correo, contraseña (mínimo 8, con letra y número) y nombre
```

**5. Iniciar el servidor**

```bash
npm start
```

Salida esperada:

```text
Conexión a MySQL Workbench establecida exitosamente.
Migraciones y modelos sincronizados con la base de datos.
Servidor de Skinker Nube corriendo en http://localhost:3000
```

Si abres `http://localhost:3000/` ves un resumen JSON de la API.

---

## 🔑 6. Variables de entorno

Archivo `backend/.env` (**nunca lo subas a Git**):

```env
PORT=
FRONTEND_URL=
DB_HOST=
DB_PORT=
DB_NAME=
DB_USER=
DB_PASSWORD=
DB_DIALECT=
JWT_SECRET=
JWT_EXPIRES_IN=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
MAIL_FROM=
```

Usa `backend/.env.example` como plantilla y copia sus nombres a `backend/.env`, completando los valores localmente.

| Variable | Obligatoria | Descripción |
|---|---|---|
| `PORT` | No (3000) | Puerto de la API. |
| `FRONTEND_URL` | No (`http://localhost:5173`) | Origen permitido por CORS y base del enlace de recuperación de contraseña. |
| `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_DIALECT` | Sí | Conexión a MySQL (`DB_DIALECT=mysql`). |
| `DB_PORT` | No (3306) | Puerto de MySQL. |
| `JWT_SECRET` | **Sí** | Clave para firmar los tokens. Si falta, el servidor **no arranca**. |
| `JWT_EXPIRES_IN` | No (`8h`) | Duración de la sesión. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | No | Servidor de correo. Si faltan, los correos **se muestran en la consola** (modo simulado). |
| `MAIL_FROM` | No | Remitente de los correos. |

---

## 🗄️ 7. Base de datos

Base **`skinker_nube_db`** (MySQL, `utf8mb4`). Script completo: `backend/database/init.sql`.

### 7.1 Tablas

| Tabla | Propósito | Usada por el backend |
|---|---|---|
| `categorias` | Categorías de productos (nombre único). | Sí |
| `usuarios` | Cuentas con login: administrador, vendedor y cliente. | Sí |
| `productos` | Catálogo: precio, **costo**, stock, stock mínimo, imagen, ingredientes, modo de uso y estado activo. | Sí |
| `clientes` | Datos de quien compra (carnet opcional y único). | Sí |
| `ventas` | Cabecera de la venta: total, envío, estados, dirección y ubicación, comprobante. | Sí |
| `detalle_ventas` | Productos de cada venta, con precio y costo guardados al vender. | Sí |
| `pagos` | Pago confirmado: monto, método y quién lo confirmó. | Sí |
| `movimientos_inventario` | Auditoría del stock (entrada, salida, ajuste). | Reservada (aún no se escribe en ella) |
| `notificaciones` | Avisos por pedido. | Reservada (Paso 6, pendiente) |

### 7.2 Relaciones principales

```text
categorias 1 ──── N productos
usuarios   1 ──── N ventas        (id_usuario = cliente que compró en línea)
usuarios   1 ──── N ventas        (id_vendedor = vendedor que registró o confirmó)
clientes   1 ──── N ventas
ventas     1 ──── N detalle_ventas ──── N:1 productos   (RESTRICT: no se borra un producto con ventas)
ventas     1 ──── N pagos
```

- Al borrar una venta se borran su detalle y sus pagos (`CASCADE`).
- Al borrar una categoría, sus productos quedan sin categoría (`SET NULL`), pero el servicio **bloquea** ese borrado si tiene productos.

### 7.3 Estados de una venta

| Campo | Valores | Significado |
|---|---|---|
| `estado` | `registrada`, `anulada` | Una venta anulada no cuenta en ganancias ni reportes. |
| `estado_pedido` | `pendiente` → `pagado` → `enviado` | El valor `entregado` existe en la base pero está reservado: el flujo actual termina en `enviado`. |

### 7.4 Restricciones destacadas

`CHECK` de precio (mayor a 0 y hasta 5000), de costo, stock y cantidades no negativas, y de latitud y longitud válidas; `UNIQUE` en correo, carnet y nombre de categoría.

### 7.5 Sincronización con Sequelize

Al arrancar, `sequelize.sync()` crea las tablas que falten **a partir de los modelos**, pero no modifica las existentes. Por eso el script `init.sql` es la fuente oficial del esquema.

---

## 🔐 8. Autenticación y roles

1. El usuario inicia sesión en `POST /api/auth/login` y recibe un **token JWT** (HS256, 8 horas por defecto).
2. El cliente envía el token en cada petición: `Authorization: Bearer <token>`.
3. Los middlewares validan el token y el rol.

| Middleware | Efecto |
|---|---|
| `verificarToken` | Exige sesión válida; si no, responde **401**. |
| `soloAdmin` | Solo rol `administrador`; si no, **403**. |
| `adminOVendedor` | Administrador o vendedor. Un vendedor **desactivado** recibe 403. |
| `adminSiPideTodos` | Ruta pública que, con `?todos=true`, exige ser administrador. |
| `validateId` | Rechaza con 400 un `:id` que no sea entero positivo. |

### Resumen de permisos

| Acción | Público | Cliente | Vendedor | Admin |
|---|:---:|:---:|:---:|:---:|
| Ver catálogo y categorías | ✅ | ✅ | ✅ | ✅ |
| Comprar y ver mis pedidos | | ✅ | | |
| Subir comprobante de pago | | ✅ (solo el suyo) | | |
| Registrar venta de tienda y buscar cliente por carnet | | | ✅ | ✅ |
| Confirmar pago, rechazar pago y enviar pedidos en línea | | | ✅ | ✅ |
| Ver sus ventas (`/ventas/mias`) | | | ✅ | ✅ |
| CRUD de productos y categorías, subir imágenes | | | | ✅ |
| Vendedores, usuarios, clientes, ventas totales y reportes | | | | ✅ |

---

## 🌐 9. Endpoints de la API

Base URL: `http://localhost:3000/api`

### 9.1 Autenticación (`/api/auth`)

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/auth/login` | Público | Inicia sesión y devuelve `token` y `usuario`. |
| POST | `/auth/registro` | Público | Crea una cuenta de **cliente** (nombre, correo, celular y contraseña) e inicia sesión. |
| POST | `/auth/olvide-contrasena` | Público | Envía el enlace de recuperación (responde igual exista o no el correo). |
| POST | `/auth/restablecer-contrasena` | Público | Cambia la contraseña con el `token` del enlace. |

### 9.2 Productos (`/api/productos`)

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/productos` | Público | Productos activos. Parámetros: `?buscar=texto` (por nombre) y `?todos=true` (incluye inactivos; solo admin). |
| POST | `/productos` | Admin | Crea un producto. |
| PUT | `/productos/:id` | Admin | Edita un producto. |
| DELETE | `/productos/:id` | Admin | **Desactiva** el producto (no lo borra). |
| DELETE | `/productos/:id/definitivo` | Admin | Elimina el producto (la base lo impide si tiene ventas). |
| GET | `/productos/stock-bajo` | Admin | Productos con stock por debajo del mínimo. |
| PATCH | `/productos/mover` | Admin | Mueve varios productos a otra categoría (`ids` e `id_categoria`). |

### 9.3 Categorías (`/api/categorias`)

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/categorias` | Público | Lista las categorías. |
| POST | `/categorias` | Admin | Crea una categoría (nombre único). |
| PUT | `/categorias/:id` | Admin | Edita una categoría. |
| DELETE | `/categorias/:id` | Admin | Elimina una categoría **sin productos**. |

### 9.4 Clientes (`/api/clientes`)

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/clientes/carnet/:carnet` | Admin, vendedor | Busca un cliente por carnet para autocompletar la venta. |
| GET | `/clientes` | Admin | Lista los clientes. |
| POST | `/clientes` | Admin | Registra un cliente. |

### 9.5 Usuarios y vendedores (`/api/usuarios`)

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/usuarios` | Admin | Lista los usuarios. |
| GET | `/usuarios/vendedores` | Admin | Lista los vendedores con sus ventas con pago confirmado y el total vendido. |
| POST | `/usuarios/vendedores` | Admin | Crea un vendedor (nombre, correo y contraseña). |
| PATCH | `/usuarios/vendedores/:id/activo` | Admin | Activa o desactiva un vendedor. |
| GET | `/usuarios/vendedores/:id/ventas` | Admin | Ventas de un vendedor. |

### 9.6 Ventas (`/api/ventas`)

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/ventas` | Sesión iniciada | **Compra en línea** del cliente. Requiere `items` y dirección escrita o ubicación (`ubicacion_lat`, `ubicacion_lng`). |
| GET | `/ventas` | Admin | Historial completo de ventas. |
| GET | `/ventas/:id/factura` | Dueño de la venta o admin | Descarga el ticket PDF (en pedidos en línea, solo con el pago confirmado). |
| POST | `/ventas/vendedor` | Admin, vendedor | Registra una **venta de tienda** (`cliente` e `items`). |
| GET | `/ventas/mias` | Admin, vendedor | Ventas registradas por el usuario. |
| POST | `/ventas/:id/pagos` | Admin, vendedor | Confirma el pago (`metodo`: `efectivo`, `qr` o `transferencia`). |
| PATCH | `/ventas/:id/cancelar` | Dueño de la venta o pedido, o admin | Anula ventas pendientes y ventas cobradas propias del vendedor que aún no se enviaron, dentro de 20 minutos; devuelve el stock. El reembolso de pagos cobrados se gestiona manualmente y el pago queda como historial. |
| GET | `/ventas/mis-pedidos` | Sesión iniciada | Pedidos del cliente. |
| POST | `/ventas/:id/comprobante` | Cliente dueño | Sube el comprobante (campo `comprobante`, JPG/PNG/WEBP/PDF, máx. 5 MB). |
| GET | `/ventas/en-linea` | Admin, vendedor | Pedidos en línea (el vendedor ve los pendientes y los que él confirmó). |
| PATCH | `/ventas/:id/rechazar-pago` | Admin, vendedor | Envía al cliente un `mensaje` indicando que su pago no llegó. |
| PATCH | `/ventas/:id/estado` | Admin, vendedor | Pasa un pedido de `pagado` a `enviado`. |

### 9.7 Imágenes (`/api/upload`)

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| POST | `/upload` | Admin | Sube una imagen de producto (campo `imagen`, JPG/PNG/WEBP, máx. 5 MB). Devuelve la ruta `/uploads/...`. |

### 9.8 Reportes (`/api/reportes`) — solo administrador

| Método | Ruta | Parámetros | Descripción |
|---|---|---|---|
| GET | `/reportes/ventas` | `desde`, `hasta`, `agrupar=dia\|mes`, `formato=pdf\|excel` | Ventas, ingresos, costo y ganancia por periodo y por vendedor. |
| GET | `/reportes/ganancias` | `desde`, `hasta`, `formato` | Unidades, ingresos, costo y ganancia por producto. |
| GET | `/reportes/inventario` | `formato` | Stock actual, mínimos y valor a costo. |

Sin `formato`, devuelven JSON (es lo que muestra la pantalla de Reportes). Con `formato=pdf` o `formato=excel`, devuelven el archivo para descargar.

### 9.9 Archivos estáticos

`GET /uploads/<archivo>` sirve las imágenes y comprobantes subidos.

---

## 📦 10. Formato de respuestas y errores

**Éxito**

```json
{ "success": true, "mensaje": "Venta registrada", "data": { "id_venta": 12, "total": 215, "envio": 0 } }
```

**Error**

```json
{ "success": false, "mensaje": "Stock insuficiente para el producto: Crema Hidratante Reparadora", "error": "Stock insuficiente para el producto: Crema Hidratante Reparadora" }
```

| Código | Cuándo |
|---|---|
| 200 / 201 | Operación correcta / recurso creado. |
| 400 | Datos inválidos (validaciones, ID inválido, stock insuficiente). |
| 401 | Sin sesión, token inválido o vencido. |
| 403 | Sin permiso para esa acción o cuenta desactivada. |
| 404 | Recurso no encontrado. |
| 409 | Conflicto (correo o categoría ya existente). |
| 429 | Demasiados intentos (límite de peticiones). |
| 500 | Error interno: el mensaje es genérico y el detalle solo se registra en la consola del servidor. |

---

## 📏 11. Reglas de negocio

**Productos**
- Precio mayor a 0 y hasta Bs 5.000; el stock al crear debe estar entre 1 y 200.
- Búsqueda por nombre con consulta parametrizada (caracteres especiales escapados).
- Un producto inactivo no se vende ni se muestra al cliente.

**Ventas**
- Toda venta se registra en una **transacción**: si algo falla, se revierte todo (stock incluido).
- Se valida que el producto exista, esté activo y tenga stock suficiente.
- Se guardan `precio_unitario` y `costo_unitario` al momento de vender.
- **Envío:** gratis desde Bs 100 de subtotal; si no, Bs 15. Las ventas de tienda no llevan envío.
- La compra en línea exige **dirección escrita o ubicación** (latitud y longitud válidas).
- **Ganancia** = subtotal − (costo × cantidad), sin contar el envío.

**Pagos y pedidos en línea**
- Un pedido en línea no se puede cobrar hasta que el cliente **suba su comprobante**.
- Al confirmar el pago, el pedido pasa a `pagado` y queda asignado al vendedor que lo confirmó.
- Si el pago no llegó, el vendedor envía un mensaje y el comprobante se limpia para que el cliente suba otro.
- El estado solo avanza de `pagado` a `enviado`, y un vendedor solo envía los pedidos que confirmó él.

**Cancelación**
- Las ventas pendientes se pueden anular dentro de los **20 minutos** posteriores a crearlas; el stock se devuelve.
- El vendedor dueño también puede anular una venta cobrada si aún no se envió y está dentro de esos 20 minutos. El pago permanece como historial y su reembolso debe gestionarse manualmente.

**Categorías y vendedores**
- No se elimina una categoría con productos.
- Un vendedor desactivado no puede iniciar sesión ni usar el panel.

---

## 🛡️ 12. Seguridad

| Medida | Detalle |
|---|---|
| Contraseñas | Cifradas con bcrypt. Reglas: 8 a 72 caracteres, con al menos una letra y un número. |
| Sesión | JWT HS256 con vigencia configurable; el servidor no arranca sin `JWT_SECRET`. |
| Login | Mismo mensaje si falla el correo o la contraseña (no revela cuál existe). |
| Límite de intentos | Login: 10 por 15 min · Registro: 10 por hora · Recuperación: 5 por 15 min · Restablecer: 10 por 15 min. |
| Recuperación | Token aleatorio de 32 bytes; en la base solo se guarda su **hash SHA-256**; vale 1 hora y es de un solo uso. |
| Cabeceras | `helmet`, y CORS limitado a `FRONTEND_URL`. |
| Autorización | Rol validado en cada ruta; cada vendedor ve solo sus ventas; el cliente solo accede a sus pedidos. |
| Archivos | Tipo validado, extensión definida por el servidor, nombres aleatorios, máximo 5 MB y `dotfiles` denegados. |
| Entradas | `validateId`, consultas parametrizadas por Sequelize y validación de datos en los servicios. |
| Errores | Los fallos internos devuelven un mensaje genérico. |

---

## 📎 13. Archivos subidos, correo y reportes

- **Archivos:** se guardan en `backend/uploads/` y se sirven en `/uploads/...`. Agrega `backend/uploads/` y `.env` a `.gitignore`.
- **Correo:** solo se envía el correo de **recuperación de contraseña**. Con SMTP configurado se envía de verdad; sin SMTP se imprime en la consola como `[CORREO SIMULADO]`, útil en desarrollo.
- **Reportes y tickets:** se generan al momento con `pdfkit` y `exceljs`. Los reportes cuentan solo ventas con pago confirmado.

---

## 🧪 14. Pruebas

### Pruebas de API con Newman

La colección automatizada está en `postman/nube_final.postman_collection.json`. Newman ejecuta las peticiones y comprueba los códigos y respuestas esperados.

1. Instala Newman una vez (es una herramienta de pruebas, no una dependencia de la API):

   ```bash
   npm install --global newman
   newman --version
   ```

2. Prepara una base de datos **de pruebas**, ejecuta `backend/database/init.sql`, crea las cuentas de administrador y vendedor y verifica que existan un producto activo con stock y una categoría.
3. Inicia el backend con `npm start` desde `backend/` y ejecuta Newman desde la raíz del repositorio. Usa las credenciales creadas y los IDs válidos del producto y categoría:

   ```bash
   newman run postman/nube_final.postman_collection.json --env-var "baseUrl=http://localhost:3000" --env-var "adminCorreo=CORREO_ADMIN" --env-var "adminContrasena=CONTRASENA_ADMIN" --env-var "vendCorreo=CORREO_VENDEDOR" --env-var "vendContrasena=CONTRASENA_VENDEDOR" --env-var "productoId=1" --env-var "categoriaId=1"
   ```

   La colección tiene valores iniciales `productoId=1` y `categoriaId=1`; reemplázalos si en tu base tienen otros IDs. Las variables pasadas con `--env-var` solo aplican a esa ejecución: no guardes contraseñas en la colección ni las subas a Git.

La colección ejecuta los grupos en orden: sesiones, validaciones, ventas de caja y web, productos/categorías, roles y seguridad. El último grupo limpia parte de los datos creados; usa una base desechable y deja que Newman termine para que esa limpieza se ejecute. No uses `--bail` ni ejecutes esta colección en producción. Newman devuelve un código distinto de cero si fallan peticiones o aserciones.

`npm test` todavía no ejecuta pruebas unitarias: su script es solo un marcador. Newman cubre pruebas de integración HTTP; Postman también permite ejecutar la colección manualmente.

---

## 🩺 15. Problemas frecuentes

| Síntoma | Causa probable | Solución |
|---|---|---|
| `Falta JWT_SECRET en el archivo .env` | No existe el `.env` o no tiene esa variable. | Crea `backend/.env` según la sección 6. |
| `No se pudo conectar a la base de datos` | MySQL apagado o credenciales incorrectas. | Revisa `DB_*` en el `.env` y que MySQL esté activo. |
| `Duplicate column name` al ejecutar el SQL | Se ejecutó un script antiguo sobre una base que ya tenía esas columnas. | Usa el `init.sql` actual solo en una base nueva. |
| El frontend dice "Error de conexión" | El backend no está corriendo o `FRONTEND_URL` no coincide. | Inicia `npm start` desde `backend/` y revisa CORS. |
| Las imágenes no se ven | La carpeta `uploads/` no está o la ruta cambió. | Reinicia el servidor y vuelve a subir la imagen. |
| 429 Demasiados intentos | Se superó el límite de peticiones de autenticación. | Espera el tiempo indicado en el mensaje. |
| No llegan correos | SMTP sin configurar. | Completa `SMTP_*` o lee el enlace en la consola. |

---

## 🔭 16. Metas a futuro

- Módulo de **notificaciones** por pedido (tabla `notificaciones` ya creada).
- Envío de la **factura por correo** y avisos por WhatsApp.
- Uso de `movimientos_inventario` para auditar el stock.
- Script `start` en el `package.json` y despliegue.
- Pruebas automatizadas.