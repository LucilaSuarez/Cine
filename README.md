# CINEFRA · Sistema de Cine

Aplicación web para consultar la cartelera de un cine, elegir butacas en tiempo real, comprar entradas y productos de Candy Bar, y obtener un comprobante con código QR. Incluye paneles para empleados (validación de entradas y retiro de Candy Bar) y para administradores.

Trabajo realizado con fines educativos para **Programación IV — UTN**.

- **Aplicación desplegada:** https://cine-one-wine.vercel.app/
- **Repositorio:** https://github.com/LucilaSuarez/Cine

---

## Tecnologías

| Área | Tecnología |
|---|---|
| Frontend | Angular 22 (componentes standalone, Signals, Control Flow `@if` / `@for`) |
| Backend como servicio | Supabase: Auth, PostgreSQL, Realtime, Storage y Row Level Security |
| Formularios | Reactive Forms con validadores personalizados |
| Comprobante | `qrcode` (código QR) y `jspdf` (PDF) |
| Estilos | CSS propio con variables globales y Bootstrap Icons |
| Despliegue | Vercel |

---

## Requisitos para ejecutarlo

- Node.js 20 o superior y npm
- Angular CLI (`npm install -g @angular/cli`)
- Un proyecto de Supabase (gratuito) con el esquema de la sección [Base de datos](#base-de-datos)

## Puesta en marcha

```bash
git clone [URL DEL REPOSITORIO]
cd Cine
npm install
```


## Arquitectura

La aplicación separa la interfaz, la lógica de negocio y el acceso a datos (RTC-17):

```
src/app/
├── components/     Pantallas y componentes de interfaz (cada uno con su html, css y ts)
├── services/       Acceso a Supabase y estado compartido (auth, peliculas, funciones, candy, compra, perfil)
├── guard/          Guards de ruta: autenticación, invitado y rol
├── validators/     Validadores personalizados de formularios
├── pipes/          Pipes personalizados: duración, edad y precio
├── directives/     Directivas personalizadas: resaltado de butacas y restricción de edad
└── task/           Interfaces y modelos de datos
```

- **Los componentes no hablan con Supabase directamente:** lo hacen a través de servicios.
- **El estado** (sesión, perfil, selección de butacas, carrito) se maneja con **Signals** y `computed`.
- **La lógica crítica vive en la base de datos:** el precio, la contigüidad de butacas, las restricciones de edad y la confirmación de la compra se validan en una función de PostgreSQL, no en el navegador. El navegador nunca decide cuánto se cobra.

### Rutas

| Ruta | Descripción | Acceso |
|---|---|---|
| `/` | Cartelera, próximos estrenos y filtro por género | Público |
| `/peliculas/:id` | Detalle de la película y sus funciones | Público |
| `/funcion/:id` | Mapa de butacas con disponibilidad en tiempo real | Público |
| `/candy-bar` | Catálogo de productos del Candy Bar | Público |
| `/resumen-compra` | Resumen y confirmación de la compra | Público |
| `/comprobante/:qr` | Comprobante con código QR y descarga en PDF | Público |
| `/login`, `/registro` | Inicio de sesión y alta de usuarios | Solo invitados |
| `/perfil` | Datos personales y películas asistidas | Usuario registrado |
| `/acceso-personal` | Ingreso del personal | Público |
| `/empleado` | Validación de entradas y retiro de Candy Bar | Empleado y administrador |
| `/admin` | Panel de administración | Administrador |

Las rutas de `/empleado` y `/admin` se cargan de forma diferida (lazy loading) y están protegidas con `canMatch`, de modo que el código del panel ni siquiera se descarga si el usuario no tiene el rol.

---

## Decisiones técnicas

- **Compra atómica con una función RPC (`crear_compra`).** Toda la operación ocurre dentro de una única transacción de PostgreSQL: validación de edad, butacas, precios, reserva, Candy Bar y generación del QR. Si algo falla, no queda nada registrado a medias (RNF-27 a RNF-29).
- **Una butaca no puede venderse dos veces.** La tabla `butacas_ocupadas` tiene una restricción `UNIQUE (funcion_id, butaca_id)`. Aunque dos personas elijan la misma butaca al mismo tiempo, la base rechaza la segunda. Realtime solo mejora la experiencia, y la garantía es la restricción.
- **Funciones de cine sin superposición.** Una restricción `EXCLUDE USING gist` impide que dos funciones se pisen en una misma sala, contando 30 minutos de margen después de cada una. Un trigger calcula el horario de fin y asigna automáticamente la primera sala libre si no se indica ninguna (RN-05 a RN-08).
- **Butacas contiguas.** Se exige misma fila, mismo sector y números consecutivos; el pasillo corta la contigüidad. La regla se valida en el navegador (validador personalizado) y de nuevo en la base de datos.
- **Compras anónimas.** Cualquier persona puede comprar sin registrarse indicando un email. El comprobante se recupera mediante el UUID del código QR, que no es adivinable.
- **Estados independientes de entrada y Candy Bar.** Validar el ingreso no consume el retiro de productos y viceversa (RN-24 a RN-27): son columnas separadas en la tabla `compras`.
- **Seguridad.** RLS en todas las tablas: lectura pública del catálogo, y cada usuario ve solo sus propios datos. Las escrituras críticas (compras, validaciones) solo se hacen a través de funciones RPC. Un trigger impide que un cliente se modifique el rol desde el navegador.
- **Paleta unificada con variables CSS** en `styles.css`: cambiar un color en un solo lugar actualiza toda la aplicación.

---

## Integración con Supabase

| Servicio | Uso en el proyecto |
|---|---|
| **Auth** | Registro e inicio de sesión con email y contraseña. Al registrarse, un trigger crea el perfil con los datos del formulario. |
| **PostgreSQL** | Persistencia de películas, funciones, butacas, compras, productos y perfiles. |
| **Realtime** | Escucha los cambios de `butacas_ocupadas`: cuando alguien compra una butaca, se bloquea en las pantallas abiertas sin recargar. |
| **Storage** | Buckets públicos de imágenes: `posters` (películas) y `productos` (Candy Bar). |
| **RLS** | Políticas de acceso por usuario y por rol (cliente, empleado, administrador). |

### Base de datos

Tablas principales:

`perfiles` · `generos` · `peliculas` · `peliculas_generos` · `salas` · `butacas` · `funciones` · `butacas_ocupadas` · `categorias_producto` · `productos` · `combos` · `combo_items` · `parametros` · `compras` · `compra_butacas` · `compra_items`

Funciones de PostgreSQL: `crear_compra`, `obtener_comprobante`, `rol_actual`, `asignar_sala`, `generar_butacas` y los triggers de alta de perfil y de cálculo de funciones.

Los scripts SQL para recrear el esquema están en la carpeta `sql/`.

### Roles

| Rol | Permisos |
|---|---|
| **Cliente** | Comprar, ver su perfil y sus películas asistidas. |
| **Empleado** | Validar entradas y retirar Candy Bar por código. |
| **Administrador** | Todo lo anterior, más la gestión del sistema. |

---

## Cumplimiento de los requisitos técnicos de la cursada

| Requisito | Dónde se aplica |
|---|---|
| Angular 22 y Standalone Components | Toda la aplicación |
| Signals | Sesión, perfil, selección de butacas, carrito y filtros |
| Control Flow (`@if`, `@for`) | Todas las plantillas |
| Lazy Loading | Rutas de pantallas; paneles de empleado y admin |
| Guards | `authGuard`, `guestGuard` y `rolGuard` |
| Pipes personalizados | `duracion`, `edad` y `precio` |
| Directivas personalizadas | `appHighlightButaca` y `appRestrictEdad` |
| Validadores personalizados | Butacas contiguas, fecha de nacimiento y contraseñas iguales |
| Supabase | Auth, PostgreSQL, Realtime, Storage y RLS |

---

## Estado de los requerimientos

### Implementado

- Registro, inicio de sesión y perfil de usuario (RF-01)
- Cartelera, próximos estrenos, filtro por género y detalle con funciones (RF-02)
- Mapa de butacas con tipos estándar, accesible y VIP, y disponibilidad en tiempo real (RF-03)
- Catálogo de Candy Bar y agregado a la compra (RF-04)
- Compra atómica con restricción de edad y compra sin cuenta (RF-01.6 a RF-01.9, RF-04.4)
- Comprobante con código QR y descarga en PDF, con la leyenda de restricción de edad (RF-06.1, RF-06.2)
- Guards por rol y paneles de acceso restringido (RF-01.3, RF-07.8)

### Parcial

- Panel de empleado: validación de entrada y retiro de Candy Bar (RF-06.3 a RF-06.5, RF-07.4)
- Panel de administración: gestión de productos, parámetros y reportes básicos (RF-07)

### Pendiente

- Cancelación de compras y crédito a favor (RF-05.4)
- Sistema de puntos, canjes y cupones de descuento (RF-05.3, RF-05.5 a RF-05.7)
- Calificaciones y reseñas (RF-02.5)
- Búsqueda por nombre y las 3 películas más vendidas en la portada (RF-02.3, RF-02.4)
- Preventa (RF-02.7)
- Inicio de sesión con Google y GitHub (RF-01.2)
- Notificaciones push, PWA y funcionamiento sin conexión (RNF-19 a RNF-26)
- Exportación de reportes a Excel y registro de actividad administrativa (RF-07.6, RF-07.7)

### Fuera de alcance

- Mapa interactivo del edificio del cine, según el SRS.

---

## Autora

**Lucila Micaela Suarez** — Programación IV, UTN.