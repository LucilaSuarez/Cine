# CINEFRA · Sistema de Cine 🍿

Aplicación web para consultar la cartelera de un cine, seleccionar butacas con disponibilidad en tiempo real, comprar entradas y productos de Candy Bar, y obtener un comprobante con código QR descargable en PDF.

Incluye perfiles de usuario y paneles para empleados y administradores, con funcionalidades de validación de entradas, retiro de productos y gestión del sistema.

**Proyecto académico desarrollado para Programación IV — Universidad Tecnológica Nacional (UTN).**

- **Aplicación desplegada:** https://cine-one-wine.vercel.app/
- **Repositorio:** https://github.com/LucilaSuarez/Cine

---

## Tecnologías

| Área | Tecnología |
|---|---|
| Frontend | Angular 22, componentes standalone, Signals y Control Flow |
| Backend como servicio | Supabase |
| Base de datos | PostgreSQL |
| Autenticación | Supabase Auth |
| Actualización en tiempo real | Supabase Realtime |
| Almacenamiento | Supabase Storage |
| Seguridad de datos | Row Level Security (RLS) |
| Formularios | Reactive Forms y validadores personalizados |
| Comprobantes | `qrcode` y `jspdf` |
| Interfaz y estilos | CSS propio, variables globales y Bootstrap Icons |
| Despliegue | Vercel |
| PWA | Angular Service Worker y Web App Manifest |

## Requisitos para ejecutar el proyecto

- Node.js compatible con Angular 22 y npm.
- Angular CLI.
- Un proyecto de Supabase configurado con el esquema y las funciones SQL necesarios.
- Variables de configuración de Supabase correctamente definidas para el entorno local.

## Puesta en marcha

Clonar el repositorio e instalar las dependencias:

```bash
git clone https://github.com/LucilaSuarez/Cine.git
cd Cine
npm install
```

Configurar las variables necesarias para la conexión con Supabase y ejecutar la aplicación:

```bash
ng serve
```

La aplicación estará disponible en `http://localhost:4200/`.

Para generar una compilación de producción:

```bash
ng build
```
---

## Arquitectura

La aplicación separa la interfaz, la lógica de negocio y el acceso a los datos.

```text
src/app/
├── components/   Pantallas y componentes de interfaz
├── services/     Acceso a Supabase y estado compartido
├── guard/        Protección de rutas por autenticación y rol
├── validators/   Validadores personalizados
├── pipes/        Transformación de duración, edad y precio
├── directives/   Resaltado de butacas y restricción de edad
└── task/         Interfaces y modelos de datos
```

### Principios de diseño

- **Separación de responsabilidades:** los componentes delegan el acceso a Supabase en los servicios correspondientes.
- **Estado reactivo:** se utilizan Signals y `computed` para gestionar la sesión, el perfil, la selección de butacas y el carrito.
- **Validaciones en el servidor:** las reglas críticas de compra se verifican en PostgreSQL, además de las validaciones de la interfaz. El navegador no determina por sí solo el importe definitivo de una compra.
- **Componentes standalone:** la aplicación utiliza la arquitectura standalone de Angular.
- **Carga diferida:** los paneles de administración y empleados utilizan lazy loading y protección de rutas.

## Rutas principales

| Ruta | Descripción | Acceso |
|---|---|---|
| `/` | Cartelera, próximos estrenos y filtro por género | Público |
| `/peliculas/:id` | Detalle de película y funciones disponibles | Público |
| `/funcion/:id` | Selección de butacas y disponibilidad | Público |
| `/candy-bar` | Catálogo de productos | Público |
| `/resumen-compra` | Resumen y confirmación de compra | Público |
| `/comprobante/:qr` | Comprobante y descarga en PDF | Público |
| `/login` y `/registro` | Inicio de sesión y registro | Solo invitados |
| `/perfil` | Datos personales y películas asistidas | Usuario registrado |
| `/acceso-personal` | Acceso para el personal | Público |
| `/empleado` | Validación de entradas y retiro de Candy Bar | Empleado y administrador |
| `/admin` | Administración del sistema | Administrador |

Las rutas de los paneles de empleados y administración están protegidas mediante guards y utilizan carga diferida.

---

## Decisiones técnicas

### 1. Compra atómica mediante PostgreSQL

La función RPC `crear_compra` centraliza las operaciones críticas de la compra. Las validaciones y escrituras se realizan en la base de datos para evitar registros incompletos cuando una operación falla.

### 2. Prevención de ventas duplicadas

La tabla `butacas_ocupadas` cuenta con una restricción `UNIQUE (funcion_id, butaca_id)`. Esto impide que una misma butaca se venda dos veces para una misma función, incluso si dos usuarios intentan comprarla simultáneamente.

Supabase Realtime permite reflejar los cambios en las pantallas abiertas, mientras que la restricción de la base de datos garantiza la integridad.

### 3. Gestión de funciones y salas

Las restricciones de la base de datos impiden superposiciones de funciones en una misma sala, contemplando un margen de 30 minutos entre proyecciones. Un trigger calcula el horario de finalización y permite asignar automáticamente una sala disponible cuando corresponde.

### 4. Selección de butacas contiguas

La selección debe respetar la misma fila, el mismo sector y la numeración consecutiva. Los pasillos interrumpen la contigüidad. Esta regla se comprueba tanto en la interfaz como en la base de datos.

### 5. Compras sin registro

El sistema permite comprar entradas sin crear una cuenta, solicitando un correo electrónico. El comprobante se recupera mediante el identificador asociado al código QR.

### 6. Validación independiente de entradas y Candy Bar

El estado de validación de la entrada es independiente del estado de retiro de los productos. Validar el ingreso al cine no marca automáticamente como retirado el pedido de Candy Bar, ni viceversa.

### 7. Seguridad y permisos

Se utiliza Row Level Security (RLS) para controlar el acceso a los datos según el usuario y su rol. Las operaciones críticas se canalizan mediante funciones de PostgreSQL, y un trigger impide que un cliente modifique su propio rol desde el navegador.

### 8. Estilos reutilizables

La aplicación utiliza variables CSS globales para mantener una paleta visual unificada y facilitar los cambios de diseño.

---

## Integración con Supabase

| Servicio | Uso en el proyecto |
|---|---|
| **Auth** | Registro e inicio de sesión con correo electrónico y contraseña; integración con proveedores sociales configurados. |
| **PostgreSQL** | Persistencia de películas, funciones, butacas, compras, productos y perfiles. |
| **Realtime** | Actualización de la disponibilidad de butacas cuando se registran cambios. |
| **Storage** | Almacenamiento de imágenes de películas y productos del Candy Bar. |
| **RLS** | Control de acceso a los datos según las políticas configuradas. |

### Base de datos

Entre las tablas principales se encuentran:

`perfiles` · `generos` · `peliculas` · `peliculas_generos` · `salas` · `butacas` · `funciones` · `butacas_ocupadas` · `categorias_producto` · `productos` · `combos` · `combo_items` · `parametros` · `compras` · `compra_butacas` · `compra_items`

Entre las funciones de PostgreSQL se incluyen:

- `crear_compra`
- `obtener_comprobante`
- `rol_actual`
- `asignar_sala`
- `generar_butacas`

También se utilizan triggers para la creación del perfil de usuario y el cálculo y la gestión de las funciones.

Los scripts SQL para configurar el esquema se encuentran en la carpeta `sql/`.

### Roles del sistema

| Rol | Permisos principales |
|---|---|
| **Cliente** | Comprar entradas y productos, consultar su perfil y sus películas asistidas. |
| **Empleado** | Validar entradas y registrar el retiro de productos del Candy Bar. |
| **Administrador** | Acceder a las funciones del personal y gestionar las áreas administrativas habilitadas. |

---

## Cumplimiento de los requisitos técnicos

| Requisito | Aplicación |
|---|---|
| Angular 22 y componentes standalone | Arquitectura general de la aplicación |
| Signals y `computed` | Sesión, perfil, selección de butacas, carrito y filtros |
| Control Flow (`@if`, `@for`) | Plantillas de Angular |
| Lazy loading | Carga diferida de rutas y paneles |
| Guards | `authGuard`, `guestGuard` y `rolGuard` |
| Pipes personalizados | `duracion`, `edad` y `precio` |
| Directivas personalizadas | `appHighlightButaca` y `appRestrictEdad` |
| Validadores personalizados | Contigüidad de butacas, fecha de nacimiento y contraseñas |
| Supabase | Auth, PostgreSQL, Realtime, Storage y RLS |
| Progressive Web App (PWA) | Configuración inicial de manifest y Service Worker; funcionamiento offline en pruebas |

---

## Estado de los requerimientos

### Implementado

- Registro, inicio de sesión y perfil de usuario (RF-01).
- Cartelera, próximos estrenos, filtro por género y detalle de películas con funciones (RF-02).
- Selección de butacas estándar, accesibles y VIP, con disponibilidad en tiempo real (RF-03).
- Catálogo de Candy Bar e incorporación de productos a la compra (RF-04).
- Compra atómica con validaciones y posibilidad de compra sin cuenta (RF-01.6 a RF-01.9 y RF-04.4).
- Comprobante con código QR y descarga en PDF, incluida la leyenda de restricción de edad (RF-06.1 y RF-06.2).
- Protección de rutas según autenticación y rol (RF-01.3 y RF-07.8).
- Gestión de salas y funciones, incluida la asignación automática de sala.

### Parcial

- **Panel de empleado:** funcionalidades de validación de entradas y retiro de Candy Bar (RF-06.3 a RF-06.5 y RF-07.4).
- **Panel de administración:** gestión de productos, parámetros, salas, funciones y reportes básicos (RF-07).
- **PWA:** configuración inicial incorporada; queda verificar el funcionamiento completo sin conexión y las notificaciones push.

### Pendiente

- Sistema de puntos, canjes y cupones de descuento (RF-05.3 y RF-05.5 a RF-05.7).
- Preventa de entradas (RF-02.7).
- Notificaciones push y funcionamiento offline completo (RNF-19 a RNF-26).
- Exportación de reportes a Excel y registro de actividad administrativa (RF-07.6 y RF-07.7).

### Fuera de alcance

- Mapa interactivo del edificio del cine, según el documento de requerimientos.

---

## Autora

**Lucila Micaela Suarez**  
Programación IV — Universidad Tecnológica Nacional (UTN)
