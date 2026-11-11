# Taller 10 — Evidencias de peticiones HTTP

## Proyecto

**TutorHub — Aplicaciones Web**

Aplicación desarrollada con Svelte 5, TypeScript y Supabase.

## Integrantes

- Carlos Enrique Espinoza Ponce
- Roberth Mauricio Solorzano Garcia

---

## 1. Introducción

El propósito de estas pruebas es comprobar cómo responde TutorHub cuando realiza peticiones HTTP a Supabase en diferentes situaciones de autenticación, autorización y actualización de datos.

Se utilizaron las herramientas de desarrollo del navegador, principalmente **Network → Fetch/XHR**, para observar las peticiones realizadas, los códigos HTTP y las respuestas del servidor.

Las pruebas permiten verificar que los cambios de estado de los tutoriales se realizan en Supabase antes de actualizar la información presentada en pantalla.

También se comprueba que una respuesta HTTP exitosa no siempre significa que se haya modificado un registro, especialmente cuando intervienen las políticas RLS o cuando otro usuario ha cambiado previamente el estado de un tutorial.

## 2. Tabla de comprobación de los cinco casos

| Caso | Petición | Código HTTP | Cuerpo de la respuesta | Qué mostró la pantalla |
| --- | --- | --- | --- | --- |
| 1. Con sesión y con política | PATCH a `tutoriales`, ID 3 | 200 | Una fila actualizada con estado `en_revision` | TutorHub confirmó el cambio de WEFON a En revisión. |
| 2. Sin sesión | PATCH a `tutoriales`, ID 4 | 401 | Error `42501`: `permission denied for table tutoriales` | La aplicación permaneció como visitante, sin botones para modificar estados. |
| 3. Con sesión y sin política | PATCH a `tutoriales`, ID 8 | 200 | `[]` | TutorHub indicó que no se modificó el tutorial y actualizó el listado. |
| 4. Token alterado y página recargada | GET a `/auth/v1/user` | 403 | Error de autenticación por token inválido | Mostró «Su sesión venció. Inicie sesión otra vez.», eliminó la sesión local y recuperó el listado público. |
| 5. Copia vieja del Revisor A | PATCH a `tutoriales`, ID 6 | 200 | `[]` | Mostró una advertencia, actualizó el listado y mantuvo el tutorial en Publicado. |

**Nota sobre el caso 3:** La captura muestra la respuesta `[]` y el mensaje de actualización fallida. El código 200 es consistente con la rama de ejecución de `src/App.svelte`, aunque la columna Status no aparece visible en esa captura.

---

## 3. Caso 1 — Cambio de estado autorizado

### Objetivo

Verificar que un usuario con sesión válida y permisos suficientes puede modificar el estado de un tutorial propio.

Se comprueba específicamente la transición desde Borrador hasta En revisión realizada por una cuenta con rol Creador.

### Datos de la prueba

- **Tabla:** `public.tutoriales`
- **Tutorial utilizado:** WEFON
- **ID del tutorial:** `3`
- **Rol del usuario:** Creador
- **Estado inicial:** `borrador`
- **Estado solicitado:** `en_revision`
- **Método HTTP:** PATCH

### Petición realizada

`PATCH /rest/v1/tutoriales?id=eq.3&estado=eq.borrador&select=*`

**Cuerpo enviado:**

```json
{
  "estado": "en_revision"
}
```

La petición se realizó con una sesión autenticada y un token válido de Supabase.

Se utilizó la cabecera:

`Prefer: return=representation`

Esta cabecera permite recibir los registros modificados como respuesta a la petición.

### Resultado observado

**Código HTTP:** `200 OK`

Supabase devolvió un arreglo que contenía una fila correspondiente al tutorial ID 3 con su estado actualizado a `en_revision`.

El cambio fue confirmado por el servidor.

### Comportamiento de la aplicación

TutorHub mostró un mensaje de éxito indicando que el tutorial había pasado a En revisión.

El listado se actualizó para mostrar el nuevo estado del tutorial.

La modificación no se realizó únicamente en memoria, sino que quedó guardada en Supabase.

### Conclusión

La prueba fue satisfactoria.

Se comprobó que un usuario Creador puede ejecutar una transición autorizada cuando dispone de una sesión válida y cumple las condiciones establecidas por los permisos y políticas RLS.

La aplicación actualizó su información después de recibir la confirmación del servidor.

### Evidencias

- [caso1.png](capturas/caso1.png)
- [caso1_respuesta.png](capturas/caso1_respuesta.png)

---

## 4. Caso 2 — Intento de actualización sin sesión

### Objetivo

Comprobar que un usuario sin sesión autenticada no puede modificar el estado de un tutorial mediante la API REST de Supabase.

Esta prueba permite demostrar que las restricciones de seguridad se aplican en el servidor y no dependen exclusivamente de los controles visibles de TutorHub.

### Datos de la prueba

- **Tabla:** `public.tutoriales`
- **Tutorial utilizado:** ID `4`
- **Autenticación:** Sin sesión
- **Estado solicitado:** `en_revision`
- **Método HTTP:** PATCH

### Petición realizada

`PATCH /rest/v1/tutoriales?id=eq.4`

**Cuerpo enviado:**

```json
{
  "estado": "en_revision"
}
```

La petición se realizó utilizando únicamente la clave pública de Supabase, sin el token de acceso de un usuario autenticado.

### Resultado observado

**Código HTTP:** `401`

**Código de error PostgreSQL:** `42501`

**Mensaje devuelto por Supabase:**

```text
permission denied for table tutoriales
```

El servidor rechazó la operación porque el usuario anónimo no disponía de los permisos necesarios para actualizar la tabla.

### Comportamiento de la aplicación

TutorHub permaneció en modo visitante.

El listado público continuó disponible, pero no se mostraron botones para modificar el estado de los tutoriales.

La petición de prueba fue rechazada y no produjo cambios en la base de datos.

### Conclusión

La prueba fue satisfactoria.

Se confirmó que los permisos de Supabase impiden que un visitante realice actualizaciones no autorizadas.

La interfaz también restringe las acciones disponibles según la sesión del usuario, pero la seguridad definitiva está respaldada por los permisos de la base de datos.

### Evidencias

- [caso2.png](capturas/caso2.png)
- [caso2_respuesta.png](capturas/caso2_respuesta.png)

---

## 5. Caso 3 — Actualización con sesión y sin política RLS

### Objetivo

Comprobar que disponer de una sesión autenticada no garantiza que una modificación sea permitida cuando no existe una política RLS de actualización que autorice la operación.

La prueba busca distinguir entre los permisos SQL concedidos a un usuario autenticado y las políticas de seguridad que determinan qué registros puede modificar.

### Datos de la prueba

- **Tabla:** `public.tutoriales`
- **Tutorial utilizado:** Tutorial de prueba del caso 3
- **ID del tutorial:** `8`
- **Rol:** Revisor
- **Estado inicial:** `en_revision`
- **Método HTTP:** PATCH
- **Política evaluada:** `tutoriales_actualizar_estado`

### Configuración de la prueba

En el esquema de TutorHub, los usuarios autenticados tienen permiso para modificar la columna `estado` mediante la siguiente sentencia:

```sql
GRANT UPDATE (estado)
ON public.tutoriales
TO authenticated;
```

Sin embargo, este permiso por sí solo no garantiza que la actualización pueda afectar cualquier fila.

La tabla `tutoriales` tiene habilitada la seguridad a nivel de fila o RLS.

Para comprobar este comportamiento, se realizó un intento de actualización durante una prueba controlada sin la política de UPDATE correspondiente.

### Petición realizada

`PATCH /rest/v1/tutoriales?id=eq.8&estado=eq.en_revision&select=*`

La petición intentó cambiar el estado del tutorial utilizando una sesión autenticada.

El procedimiento empleó la cabecera:

`Prefer: return=representation`

Esto permite comprobar las filas realmente modificadas por Supabase.

### Resultado observado

**Código HTTP:** `200 OK`

**Respuesta del servidor:**

```json
[]
```

La respuesta consistió en un arreglo vacío.

Esto significa que ninguna fila fue modificada durante la petición.

### Comportamiento de la aplicación

TutorHub mostró el siguiente mensaje:

> No se modificó el tutorial. Puede que no tenga permiso o que otra persona haya cambiado su estado. Se actualizó el listado.

Después, la aplicación volvió a consultar los tutoriales.

El tutorial ID 8 permaneció en estado `en_revision`, confirmando que la actualización no se había aplicado.

### Restauración de la seguridad

Después de la prueba se restauró la política:

`tutoriales_actualizar_estado`

También se comprobó que el permiso de actualización sobre la columna `estado` continuaba concedido al rol `authenticated`.

De esta forma, la aplicación recuperó su configuración normal de autorización para los cambios de estado.

### Conclusión

La prueba fue satisfactoria.

Se comprobó que tener una sesión válida y disponer de privilegios SQL no es suficiente para modificar un registro cuando la política RLS no permite la operación.

También se verificó que una respuesta HTTP 200 puede contener un arreglo vacío y no representar una modificación exitosa.

TutorHub detectó esta situación, evitó mostrar un éxito incorrecto y actualizó el listado desde Supabase.

### Evidencia

- [caso3.png](capturas/caso3.png)

---

## 6. Caso 4 — Recuperación ante un token inválido

### Objetivo

Comprobar cómo se comporta TutorHub cuando el token de autenticación almacenado en el navegador deja de ser válido.

La prueba también permite verificar que la aplicación puede recuperarse de este error y regresar al modo visitante sin impedir el acceso al contenido público.

### Datos de la prueba

- **Componente principal:** `src/App.svelte`
- **Servicio:** Supabase Authentication
- **Almacenamiento:** `localStorage`
- **Método observado:** GET
- **Petición:** `/auth/v1/user`

### Procedimiento realizado

1. Se inició sesión con una cuenta Creador.
2. Se abrió la herramienta Application de DevTools.
3. Se localizó el almacenamiento de autenticación de Supabase en `localStorage`.
4. Se modificó temporalmente el valor del `access_token`.
5. Se recargó la página con F5.
6. Se observaron las respuestas de las peticiones de autenticación y lectura.
7. Se corrigió la validación de la sesión.
8. Se repitió la prueba para comprobar el comportamiento después del cambio.

### Petición observada

`GET /auth/v1/user`

### Resultado observado

**Código HTTP:** `403`

Supabase rechazó el token de autenticación alterado.

La sesión almacenada en el navegador no podía utilizarse correctamente para realizar consultas autenticadas.

### Comportamiento inicial

Antes de la corrección, TutorHub continuaba mostrando que existía una sesión iniciada.

Sin embargo, las peticiones que requerían autenticación devolvían errores de autorización.

Esto provocaba una inconsistencia entre lo que mostraba la interfaz y el estado real de la sesión en Supabase.

### Corrección implementada

Se incorporó una comprobación del usuario autenticado mediante:

`supabase.auth.getUser()`

La aplicación dejó de confiar únicamente en la existencia de una sesión recuperada del almacenamiento local.

Cuando detecta una respuesta de autenticación que indica que el token es inválido, limpia la sesión y actualiza la interfaz.

### Comportamiento después de la corrección

TutorHub mostró el mensaje de advertencia en rojo:

> Su sesión venció. Inicie sesión otra vez.

La aplicación eliminó la sesión local inválida y regresó al modo visitante. El listado cargó correctamente los tutoriales publicados mediante peticiones con código HTTP 200, y el formulario de inicio de sesión quedó nuevamente disponible para ingresar credenciales válidas.

### Verificación adicional

Se recargó otra vez la página después de limpiar la sesión.

La aplicación permaneció como visitante y las peticiones públicas a Supabase devolvieron HTTP 200.

No fue necesario modificar manualmente los tutoriales almacenados en la base de datos.

### Conclusión

La prueba fue satisfactoria.

Se comprobó que la aplicación puede recuperarse de un token inválido sin dejar bloqueado el listado público.

También se mejoró la coherencia entre la sesión mostrada en pantalla y la autenticación realmente aceptada por Supabase.

### Evidencias

- [caso4_error_inicial.png](capturas/caso4_error_inicial.png)
- [caso4.png](capturas/caso4.png)

---

## 7. Caso 5 — Protección contra una copia vieja

### Objetivo

Comprobar que TutorHub evita sobrescribir un cambio realizado por otro usuario cuando alguien intenta modificar un tutorial utilizando información desactualizada.

La prueba corresponde a una situación de concurrencia en la que dos revisores trabajan sobre el mismo registro.

### Datos de la prueba

- **Tabla:** `public.tutoriales`
- **Tutorial utilizado:** `tutorial de prueba`
- **ID:** `6`
- **Estado inicial:** `en_revision`
- **Estado confirmado posteriormente:** `publicado`
- **Método HTTP:** PATCH

Se utilizaron dos usuarios con rol Revisor, en navegadores diferentes.

**Revisor A:** `pepetola@gmail.com`, utilizando Brave.

**Revisor B:** `carawita@gmail.com`, utilizando Chrome.

### Procedimiento realizado

1. El Revisor A abrió TutorHub y consultó el tutorial ID 6.
2. El tutorial aparecía en estado En revisión.
3. El Revisor A mantuvo abierta la página sin recargar.
4. El Revisor B abrió TutorHub desde otro navegador.
5. El Revisor B cambió el estado del tutorial a Publicado.
6. El Revisor A continuaba viendo la copia anterior, que indicaba En revisión.
7. Sin recargar la página, A intentó devolver el tutorial a Borrador.
8. Se comprobó la petición enviada por A en Network.
9. Se verificó el estado final directamente en Supabase.

### Petición realizada por el Revisor A

`PATCH /rest/v1/tutoriales?id=eq.6&estado=eq.en_revision&select=*`

**Cuerpo enviado:**

```json
{
  "estado": "borrador"
}
```

La petición incluyó la cabecera:

`Prefer: return=representation`

### Protección utilizada

La actualización estaba condicionada por dos valores:

- `id=eq.6`: identifica el tutorial que se desea modificar.
- `estado=eq.en_revision`: exige que el tutorial todavía se encuentre en el estado que observó el Revisor A.

Cuando el Revisor B publicó el tutorial, la segunda condición dejó de cumplirse.

Por lo tanto, el intento de actualización posterior del Revisor A no encontró una fila que coincidiera con ambos filtros.

### Resultado observado

**Código HTTP:** `200 OK`

**Respuesta del servidor:**

```json
[]
```

El arreglo vacío indicó que Supabase no modificó ninguna fila.

### Comportamiento de la aplicación

TutorHub mostró el mensaje:

> No se modificó el tutorial. Puede que no tenga permiso o que otra persona haya cambiado su estado. Se actualizó el listado.

La aplicación volvió a consultar la base de datos.

Después de actualizarse, el tutorial aparecía con el estado Publicado.

La interfaz dejó de ofrecer botones para modificar su estado, porque ya no existía una transición permitida para el Revisor desde Publicado.

### Comprobación en Supabase

Se abrió Supabase Table Editor y se consultó directamente la tabla `tutoriales`.

El resultado fue:

| Campo | Valor |
| --- | --- |
| ID | `6` |
| Título | `tutorial de prueba` |
| Formato | `video` |
| Estado | `publicado` |

Se confirmó que el cambio realizado por el Revisor B permaneció guardado.

El intento posterior del Revisor A no sobrescribió la información.

### Conclusión

La prueba fue satisfactoria.

Se comprobó que un código HTTP 200 no significa necesariamente que una fila se haya actualizado.

Gracias a la condición sobre el estado anterior, Supabase evita que una petición basada en información desactualizada sobrescriba un cambio ya confirmado.

TutorHub detecta la respuesta vacía y recupera la información vigente desde la base de datos.

Esta estrategia protege la consistencia del flujo de revisión de tutoriales.

### Evidencias

- [caso5.png](capturas/caso5.png)
- [caso5_supabase.png](capturas/caso5_supabase.png)

---

## 8. Análisis general de los resultados

Los cinco casos permiten identificar tres aspectos importantes del funcionamiento de TutorHub.

### 8.1. Autenticación y autorización

La autenticación permite identificar al usuario que realiza una petición.

Sin embargo, una sesión válida no significa que ese usuario pueda modificar cualquier registro.

Supabase utiliza permisos SQL y políticas RLS para decidir qué operaciones están autorizadas.

Esto quedó demostrado mediante las pruebas sin sesión y sin política de actualización.

### 8.2. Respuestas HTTP y modificaciones reales

Durante el taller se observaron diferentes códigos HTTP:

- `200`: petición procesada correctamente, aunque puede devolver cero filas modificadas.
- `401`: petición rechazada por falta de permisos de la cuenta anónima.
- `403`: autenticación rechazada durante la prueba del token alterado.

La respuesta `[]` tiene especial importancia.

Cuando se utiliza `Prefer: return=representation`, un arreglo vacío indica que ninguna fila fue devuelta como modificada.

Por este motivo, TutorHub comprueba la cantidad de filas recibidas y no considera suficiente que el código sea HTTP 200.

### 8.3. Consistencia de los estados

Los tutoriales pueden encontrarse en los estados:

- `borrador`
- `en_revision`
- `publicado`

La aplicación utiliza una máquina de estados para establecer qué transiciones pueden ejecutar los usuarios según su rol.

Además, las actualizaciones se realizan mediante peticiones PATCH condicionadas al identificador y al estado anterior del tutorial.

Esta combinación permite prevenir transiciones inválidas desde la interfaz y evitar que una copia antigua sobrescriba un cambio confirmado en Supabase.

---

## 9. Conclusiones finales

Se realizaron las cinco pruebas de peticiones HTTP correspondientes al Taller 10.

Los resultados permitieron comprobar el comportamiento de TutorHub ante operaciones autorizadas, peticiones sin sesión, restricciones RLS, tokens inválidos y modificaciones concurrentes.

Se confirmó que **Supabase funciona como la fuente de verdad de los tutoriales y sus estados**.

La aplicación no considera exitosa una modificación únicamente porque el servidor responda HTTP 200. También comprueba las filas realmente modificadas.

Cuando una actualización no afecta ninguna fila, TutorHub muestra un mensaje de advertencia y recupera la información actual desde Supabase.

Durante la prueba de RLS se retiró temporalmente la política de UPDATE y posteriormente se restauró para mantener los permisos normales de la aplicación.

En la prueba de concurrencia, el estado Publicado se conservó correctamente, demostrando que la actualización condicionada al estado anterior evita sobrescribir modificaciones realizadas por otros usuarios.

Finalmente, la recuperación ante un token inválido permitió mantener disponible el listado público y presentar nuevamente el formulario de autenticación.

Con estas comprobaciones, la aplicación demuestra un manejo adecuado de los resultados HTTP, la separación entre autenticación y autorización y la sincronización de los cambios con la base de datos.

---

## 10. Evidencias entregadas

Las capturas principales están almacenadas en:

`docs/taller10/capturas/`

| Caso | Evidencia principal | Evidencia adicional |
| --- | --- | --- |
| 1 | `caso1.png` | `caso1_respuesta.png` |
| 2 | `caso2.png` | `caso2_respuesta.png` |
| 3 | `caso3.png` | — |
| 4 | `caso4.png` | `caso4_error_inicial.png` |
| 5 | `caso5.png` | `caso5_supabase.png` |

Estas evidencias permiten contrastar los resultados de las peticiones con el comportamiento mostrado por TutorHub.

La documentación de las decisiones de diseño, persistencia de datos y protección contra copias desactualizadas se encuentra en:

`docs/decisiones.md`

La definición de tablas, permisos y políticas RLS se encuentra en:

`docs/hito2_esquema.sql`