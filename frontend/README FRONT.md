# ☁️ Frontend - Sistema Web de Ventas "Skinker Nube"

Aplicación web desarrollada como parte de la materia **Tecnología Web II**. Este cliente web está construido como una interfaz moderna, limpia y **100% responsiva** para la gestión integral, control de inventario y punto de venta de productos de skincare y cuidado personal.

---

## 🛠️ Tecnologías Utilizadas

### ⚛️ React

Biblioteca de JavaScript para la construcción de interfaces de usuario modulares.

### 🔷 TypeScript

Superset de JavaScript que aporta tipado estático y robustez al desarrollo.

### ⚡ Vite

Herramienta de compilación y empaquetado de alto rendimiento para entorno frontend.

### 🌐 HTML5 y CSS3

Tecnologías utilizadas para la estructura y presentación de la aplicación web, con estilos personalizados adaptados mediante una paleta de colores suave y armónica.

**Color principal:**

```text
#8de5db
```

### 🔧 Git y GitHub

Herramientas utilizadas para el control de versiones local, seguimiento de cambios y respaldo remoto del proyecto en la nube.

---

# 📂 Estructura del Proyecto (Frontend)

La arquitectura del proyecto está organizada por carpetas funcionales para separar responsabilidades y asegurar un código escalable:

```text
frontend/
├── node_modules/
├── public/
├── src/
│   ├── assets/          # Recursos gráficos y estáticos
│   ├── components/      # Componentes reutilizables (Navbar, UIFeedback)
│   ├── interfaces/      # Tipado estático y modelos de datos (TypeScript)
│   ├── pages/           # Vistas principales (Catalogo, Ventas, Gestion)
│   ├── services/        # Módulo centralizado de consumo de API REST
│   ├── App.tsx          # Componente principal y enrutador de vistas
│   ├── main.tsx         # Punto de entrada de React
│   └── index.css        # Estilos globales y diseño responsive
├── .gitignore
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

# ✨ Características Principales y Módulos

## 🛍️ Catálogo de Productos

El módulo de catálogo permite visualizar y administrar los productos disponibles dentro del sistema.

### Funcionalidades principales:

- Visualización interactiva de productos mediante tarjetas en formato **grid**.
- Presentación de imágenes de los productos.
- Visualización de precios.
- Control visual del stock disponible.
- Identificación visual de productos con stock crítico.
- Buscador en tiempo real de productos.
- Operaciones CRUD integradas.
- Edición rápida de productos mediante una ventana modal.
- Alternancia del estado de los productos entre:
  - **Activo**
  - **Inactivo**

El catálogo proporciona una interfaz visual que facilita la consulta y administración de los productos disponibles para la venta.

---

## 💰 Módulo de Ventas

El módulo de ventas permite procesar las transacciones realizadas dentro del sistema.

### Funcionalidades principales:

- Formulario inteligente para registrar ventas.
- Selección de clientes existentes.
- Selección de productos existentes.
- Validación de la información antes de procesar la venta.
- Validación de existencias disponibles.
- Comunicación con el backend mediante API REST.
- Descuento automático del inventario después de una venta.
- Validación de existencias realizada en el backend.

El módulo permite centralizar el proceso de venta y mantener actualizado el inventario de productos.

---

## ⚙️ Panel de Gestión

El panel de gestión contiene secciones destinadas a la administración de información complementaria del sistema.

### 👥 Gestión de Clientes

Permite realizar el alta y control de nuevos clientes.

Los datos gestionados incluyen:

- Nombre.
- Teléfono.
- Correo electrónico.

### 🏷️ Gestión de Categorías

Permite realizar el alta y control de las categorías utilizadas para clasificar los productos.

La gestión de categorías facilita la organización del catálogo y permite mantener una estructura ordenada de los productos disponibles.

---

# 🚨 Manejo de Errores y Feedback Visual

El sistema incorpora mecanismos de retroalimentación visual para informar al usuario sobre el resultado de las operaciones realizadas.

### 🔔 Sistema de notificaciones

Se implementa un sistema global de notificaciones flotantes mediante **toasts**, utilizado para mostrar mensajes de:

- Éxito.
- Error.

Estas notificaciones permiten al usuario conocer inmediatamente si una operación fue realizada correctamente o si ocurrió algún problema.

### ⏳ Indicador de carga

El sistema incorpora un **spinner de carga** para indicar visualmente que una operación se encuentra en proceso, especialmente durante las comunicaciones con el backend y ante posibles latencias de red.

Esto permite mejorar la experiencia del usuario evitando que una operación parezca detenida o sin respuesta.

---

# 📱 Diseño Responsive

La aplicación cuenta con un diseño **100% responsive**, permitiendo que la interfaz se adapte de manera fluida a diferentes tamaños de pantalla.

El diseño contempla:

- 📱 Dispositivos móviles.
- 📲 Tablets.
- 💻 Computadoras de escritorio.

Para lograr esta adaptabilidad se utilizan:

- CSS moderno.
- Media queries.
- Diseños flexibles.
- Distribuciones adaptativas.
- Componentes preparados para diferentes resoluciones.

El objetivo es mantener una experiencia de usuario consistente independientemente del dispositivo utilizado para acceder al sistema.

---

# 🔌 Comunicación con el Backend

El frontend se comunica con el servidor backend mediante una **API REST**.

La comunicación se encuentra centralizada dentro del módulo:

```text
src/services/
```

Esta organización permite separar la lógica relacionada con las peticiones HTTP de los componentes visuales de la aplicación.

La estructura facilita:

- Consumo de endpoints.
- Envío de información al backend.
- Recepción de respuestas.
- Manejo de errores.
- Actualización de información.
- Mantenimiento del código.

El frontend depende del backend de **Skinker Nube**, el cual debe encontrarse disponible para ejecutar correctamente las operaciones que requieren acceso a datos.

---

# 🧩 Organización de Componentes

El proyecto utiliza una estructura basada en componentes reutilizables.

Dentro de:

```text
src/components/
```

se encuentran componentes utilizados en diferentes partes de la aplicación.

Entre ellos se encuentran:

- `Navbar`
- `UIFeedback`

Esta organización permite evitar la duplicación de código y facilita el mantenimiento de la interfaz.

---

# 📐 Tipado con TypeScript

El proyecto utiliza **TypeScript** para proporcionar tipado estático a la aplicación.

Los tipos e interfaces se encuentran organizados dentro de:

```text
src/interfaces/
```

Esta estructura permite definir modelos de datos utilizados por los diferentes módulos del sistema.

El uso de TypeScript ayuda a:

- Detectar errores durante el desarrollo.
- Mejorar la legibilidad del código.
- Mantener estructuras de datos consistentes.
- Facilitar el mantenimiento.
- Mejorar el desarrollo de componentes.
- Reducir errores relacionados con tipos de datos.

---

# 🖥️ Vistas Principales

Las vistas principales de la aplicación se encuentran organizadas dentro de:

```text
src/pages/
```

Entre las principales vistas se encuentran:

### 📦 Catálogo

Vista destinada a la visualización, búsqueda y administración de productos.

### 💵 Ventas

Vista destinada al registro y procesamiento de las ventas.

### ⚙️ Gestión

Vista destinada a la administración de clientes y categorías.

Esta separación permite mantener las responsabilidades de cada sección claramente organizadas.

---

# 🎨 Estilos Globales

Los estilos generales de la aplicación se encuentran en:

```text
src/index.css
```

En este archivo se establecen los estilos globales utilizados por la interfaz y las reglas necesarias para conseguir un diseño responsive.

La aplicación utiliza una paleta visual suave y armónica, destacando el color:

```text
#8de5db
```

Este color forma parte de la identidad visual utilizada en la interfaz del sistema.

---

# 🚀 Cómo Ejecutar el Proyecto Localmente

Para ejecutar el proyecto correctamente en un entorno local es necesario contar previamente con **Node.js**, preferentemente una versión **LTS**.

Además, el servidor backend de **Skinker Nube** debe encontrarse en ejecución en el:

```text
puerto 3000
```

---

## 1️⃣ Clonar el repositorio

Primero se debe clonar el repositorio del proyecto desde GitHub.

Ejemplo:

```bash
git clone URL_DEL_REPOSITORIO
```

Posteriormente, ingresar a la carpeta del proyecto:

```bash
cd frontend
```

---

## 2️⃣ Instalar las dependencias

Una vez dentro de la carpeta `frontend`, instalar todas las dependencias necesarias mediante:

```bash
npm install
```

Este comando instala las dependencias especificadas en el archivo:

```text
package.json
```

---

## 3️⃣ Ejecutar el servidor de desarrollo

Para iniciar el proyecto en modo desarrollo ejecutar:

```bash
npm run dev
```

Vite iniciará el servidor de desarrollo y mostrará en la terminal la dirección local disponible para acceder a la aplicación.

---

# 📋 Resumen de Comandos

Los principales comandos utilizados para ejecutar el proyecto son:

```bash
# Ingresar a la carpeta del frontend
cd frontend

# Instalar dependencias
npm install

# Ejecutar el servidor de desarrollo
npm run dev
```

---

# 📁 Archivos Principales

| Archivo / Carpeta | Descripción |
|---|---|
| `src/assets/` | Recursos gráficos y estáticos |
| `src/components/` | Componentes reutilizables |
| `src/interfaces/` | Interfaces y modelos de datos TypeScript |
| `src/pages/` | Vistas principales de la aplicación |
| `src/services/` | Consumo centralizado de la API REST |
| `src/App.tsx` | Componente principal y enrutador de vistas |
| `src/main.tsx` | Punto de entrada de React |
| `src/index.css` | Estilos globales y diseño responsive |
| `public/` | Archivos públicos y recursos estáticos |
| `package.json` | Dependencias y scripts del proyecto |
| `tsconfig.json` | Configuración de TypeScript |
| `vite.config.ts` | Configuración de Vite |
| `.gitignore` | Archivos y carpetas excluidos del control de versiones |

---

# 🔄 Flujo General de la Aplicación

El funcionamiento general del frontend sigue el siguiente flujo:

```text
                    ┌─────────────────────┐
                    │       USUARIO       │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      REACT UI       │
                    │   Interfaz Web      │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │     COMPONENTES     │
                    │ Navbar / Feedback   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │       PAGES         │
                    │ Catálogo / Ventas   │
                    │      Gestión        │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      SERVICES       │
                    │      API REST       │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │       BACKEND       │
                    │  Skinker Nube API   │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      DATOS / BD     │
                    └─────────────────────┘
```

---

# 🏗️ Arquitectura General del Frontend

La aplicación utiliza una organización por responsabilidades para mantener un código modular y escalable.

```text
┌───────────────────────────────────────────────┐
│                    FRONTEND                   │
├───────────────────────────────────────────────┤
│                                               │
│                  App.tsx                      │
│                    │                          │
│          ┌─────────┴─────────┐                │
│          │                   │                │
│       Components           Pages              │
│          │                   │                │
│     ┌────┴────┐       ┌─────┼─────┐          │
│     │         │       │     │     │          │
│  Navbar   UIFeedback  Catálogo Ventas Gestión │
│                            │                  │
│                            ▼                  │
│                         Services              │
│                            │                  │
│                            ▼                  │
│                         API REST              │
│                            │                  │
└────────────────────────────┼──────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │     BACKEND     │
                    └─────────────────┘
```

---

# 🔐 Consideraciones del Proyecto

Para ejecutar correctamente el frontend es importante verificar previamente:

- Tener instalado Node.js.
- Utilizar una versión LTS recomendada de Node.js.
- Tener las dependencias instaladas mediante `npm install`.
- Tener disponible el backend de Skinker Nube.
- Verificar que el backend se encuentre ejecutándose en el puerto `3000`.
- Ejecutar el frontend mediante `npm run dev`.

---

# ☁️ Proyecto Skinker Nube

**Skinker Nube** es un sistema web orientado a la gestión de ventas, productos, inventario, clientes y categorías para una tienda de productos de skincare y cuidado personal.

El frontend proporciona una interfaz moderna y responsive que permite a los usuarios interactuar con las diferentes funcionalidades del sistema mediante una experiencia visual clara y organizada.

---

# 👩‍💻 Desarrollo

Proyecto desarrollado como parte de la materia:

**Tecnología Web II**

El frontend fue desarrollado utilizando tecnologías modernas orientadas al desarrollo de aplicaciones web, priorizando:

- Modularidad.
- Reutilización de componentes.
- Tipado estático.
- Separación de responsabilidades.
- Comunicación mediante API REST.
- Diseño responsive.
- Experiencia de usuario.
- Mantenibilidad.
- Escalabilidad.

---

# 📌 Estado del Proyecto

**Frontend funcional para el sistema web de ventas Skinker Nube.**

El proyecto incluye los principales módulos necesarios para:

- Gestión de productos.
- Consulta de catálogo.
- Control visual de inventario.
- Registro de ventas.
- Gestión de clientes.
- Gestión de categorías.
- Comunicación con el backend.
- Manejo de errores.
- Feedback visual.
- Diseño responsive.

---

# 📝 Licencia

Proyecto desarrollado con fines académicos para la materia **Tecnología Web II**.