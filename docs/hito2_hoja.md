# Hito 2 — Hoja del hito: TutorHub

**Pareja:** Carlos Enrique Espinoza Ponce · Roberth Mauricio Solorzano Garcia  
**Paralelo:** Aplicaciones Web I (TI, paralelo B)  
**Producto:** TutorHub · **Repositorio:** `uleam-web-2026-2/webIB-Espinoza-Solorzano`

## 1 · Tablas

| Tabla | Columnas reales de Supabase | Relación |
|---|---|---|
| `tutoriales` | `id`, `titulo`, `descripcion`, `formato`, `estado`, `fecha_creacion`, `fecha_actualizacion`, `autor_id`, `categoria_id` | `autor_id` → `usuarios.id`; `categoria_id` → `categorias.id`. Un tutorial tiene muchos pasos y revisiones. |
| `pasos_tutorial` | `id`, `orden`, `instruccion`, `captura_url`, `posicion_x`, `posicion_y`, `elemento_html`, `texto_elemento`, `pagina_url`, `tutorial_id` | `tutorial_id` → `tutoriales.id` (muchos pasos por tutorial). |
| `usuarios` | `id`, `nombre`, `correo`, `rol`, `fecha_creacion`, `auth_user_id` | Un usuario puede crear tutoriales o realizar revisiones; `auth_user_id` enlaza con `auth.users`. |
| `categorias` | `id`, `nombre`, `descripcion` | Una categoría clasifica muchos tutoriales. |
| `revisiones` | `id`, `observaciones`, `resultado`, `fecha_revision`, `tutorial_id`, `revisor_id` | `tutorial_id` → `tutoriales.id`; `revisor_id` → `usuarios.id`. |

**Entidad principal:** `tutoriales`. **Estado en TypeScript:** `EstadoTutorial = 'borrador' | 'en_revision' | 'publicado'` (`src/tipos.ts`). Según el flujo de negocio del Hito 1, el Creador envía a revisión y solo el Revisor aprueba la publicación; las transiciones y modificaciones de estado se implementarán en una fase posterior.

## 2 · Vista × consulta

| Vista | Qué pide | A qué tabla | Con qué filtro u orden | Qué puede fallar | ¿Funciona ya? |
|---|---|---|---|---|---|
| **Mis tutoriales** (listado) | Leer | `tutoriales`, `categorias` | GET `tutoriales?select=*,categorias(nombre)&order=fecha_creacion.desc`. Sin sesión: publicados; con sesión: también los propios. | Sin conexión: error y «Reintentar»; sin resultados: aviso. | **Sí** |
| **Detalle del tutorial** | Leer | `tutoriales` (datos ya recibidos en el listado), `pasos_tutorial` | Al pulsar «Ver detalle», GET `pasos_tutorial?tutorial_id=eq.ID&select=*&order=orden.asc` (adjunta `Bearer` si hay sesión). | Error de red: mensaje y «Reintentar»; sin pasos: aviso. | **Sí** |
| **Nuevo tutorial** | Leer y crear | `categorias`, `usuarios`, `tutoriales` | GET categorías por `nombre.asc`; con sesión, GET perfil por `auth_user_id=eq.UUID`; POST a `tutoriales` con estado inicial `borrador`. | Campos inválidos: error sin POST; sin sesión: rechazo HTTP 401. | **Sí** |
| **Editor de tutorial** | Leer y modificar | `tutoriales`, `pasos_tutorial` | Pasos de tutorial propio en `borrador`, ordenados por `orden.asc`. | No es autor o no está en borrador: denegar. | **Plan** |
| **Bandeja de revisión** | Leer | `tutoriales`, `categorias` | `estado=eq.en_revision`, más recientes primero. | Usuario sin rol Revisor: denegar. | **Plan** |
| **Revisión del tutorial** | Leer, crear y cambiar estado | `tutoriales`, `pasos_tutorial`, `revisiones` | Mostrar pasos; registrar dictamen y pasar a `publicado` o devolver a `borrador`. | No es Revisor o transición no válida: denegar. | **Plan** |

**Nota:** Las tres vistas marcadas «Sí» son las demostrables del Hito 2; «Plan» significa que se diseñaron en el Hito 1, pero todavía no se implementaron.

## 3 · Matriz rol × tabla × operación

| Tabla y operación | Sin sesión | Creador | Revisor | ¿Política escrita? |
|---|---|---|---|---|
| `categorias` · leer | Sí | Sí | Sí | **Sí:** `categorias_consultar` |
| `tutoriales` · leer publicados | Sí | Sí | Sí | **Sí:** `tutoriales_publicados` |
| `tutoriales` · leer en gestión | No | Solo los suyos | Todos | **Sí:** `tutoriales_gestion` |
| `pasos_tutorial` · leer | Solo publicados | De tutoriales autorizados | De tutoriales autorizados | **Sí:** `pasos_consultar` (con sesión envía token `Bearer`) |
| `usuarios` · consultar perfil | No | Solo el suyo | Solo el suyo | **Sí:** `usuarios_perfil_propio` |
| `tutoriales` · crear | No | Sí, propio y en `borrador` | No | **Sí:** `tutoriales_crear` |
| `pasos_tutorial` · crear/editar | No | En sus borradores | No | **Diseño** |
| `tutoriales` · enviar a revisión | No | Sus borradores | No | **Diseño** |
| `tutoriales` · aprobar/devolver | No | No | Sí | **Diseño** |
| `revisiones` · leer | No | De sus tutoriales | Todas | **Diseño** |
| `revisiones` · crear | No | No | Sí | **Diseño** |

**Seguridad aplicada:** Las cinco tablas tienen RLS habilitada. `anon` carece de `GRANT INSERT` en `tutoriales`: el POST sin sesión fue rechazado con **HTTP 401** (`permission denied for table tutoriales`). Para sesiones autenticadas, `tutoriales_crear` comprueba que el usuario sea Creador, que `autor_id` le pertenezca y que el nuevo tutorial esté en `borrador`. Las operaciones marcadas «Diseño» no tienen aún políticas de escritura implementadas.

## 4 · Usuario de ejemplo

- **Correo de prueba:** `creador.tutorhub@example.com`.
- **Rol:** `Creador`, enlazado por `usuarios.auth_user_id` con Supabase Authentication.
- **Contraseña de prueba:** `hola123`.

## 5 · Recuadro de cumplimiento

- ☑ Las tablas existen en Supabase y tienen datos.
- ☑ Los tipos de `src/tipos.ts` tienen las mismas columnas.
- ☑ El listado y el detalle cargan desde Supabase.
- ☑ El formulario valida antes de enviar.
- ☑ Sin sesión no se puede crear; con sesión, sí.
- ☑ Hay una captura de respaldo de cada demostración.

**Declaración de IA:** Se usaron ChatGPT y Gemini como apoyo para estructurar documentación, explicar RLS y revisar código. El equipo comprobó el proyecto mediante `npm run check`, consultas en Supabase y la pestaña Red del navegador.