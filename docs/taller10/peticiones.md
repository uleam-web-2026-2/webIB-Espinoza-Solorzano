
# Taller 10 — Evidencias de peticiones HTTP

## Proyecto
TutorHub — Svelte 5, TypeScript y Supabase.

## Integrantes
- Carlos Enrique Espinoza Ponce
- Roberth Mauricio Solorzano Garcia

## Caso 1: Cambio de estado autorizado

**Objetivo:** Verificar que un Creador autenticado puede enviar un tutorial propio de Borrador a En revisión.

**Tabla:** `public.tutoriales`

**Tutorial utilizado:** WEFON (ID 3).

**Estado inicial:** `borrador`

**Estado solicitado:** `en_revision`

**Método HTTP:** PATCH

**Petición:**
`/rest/v1/tutoriales?id=eq.3&estado=eq.borrador&select=*`

**Cuerpo enviado:**
```json
{
  "estado": "en_revision"
}
```

**Autenticación:** Sesión válida del usuario Creador.

**Código HTTP obtenido:** 200 OK.

**Respuesta observada:** Supabase devolvió una fila con ID 3 y estado `en_revision`.

**Comportamiento de la aplicación:** TutorHub mostró el mensaje de éxito y actualizó el estado del tutorial a En revisión.

**Resultado:** Prueba satisfactoria. El cambio quedó guardado en Supabase.

**Evidencias:**
- `capturas/caso1.png`
- `capturas/caso1_respuesta.png`

---

## Caso 2: Intento de actualización sin sesión

**Objetivo:** Verificar que un visitante no puede modificar el estado de un tutorial.

**Tabla:** `public.tutoriales`

**Tutorial utilizado:** ID 4.

**Método HTTP:** PATCH

**Petición:**
`/rest/v1/tutoriales?id=eq.4`

**Cuerpo enviado:**
```json
{
  "estado": "en_revision"
}
```

**Autenticación:** Sin sesión de usuario. Se utilizó únicamente la clave pública de Supabase.

**Código HTTP obtenido:** 401.

**Código PostgreSQL:** `42501`

**Mensaje del servidor:**
`permission denied for table tutoriales`

**Comportamiento de la aplicación:** TutorHub permaneció en modo visitante y no mostró opciones para modificar estados.

**Resultado:** Prueba satisfactoria. Supabase rechazó la actualización por falta de permisos.

**Evidencias:**
- `capturas/caso2.png`
- `capturas/caso2_respuesta.png`

---


## Caso 4: Recuperación ante un token inválido

**Objetivo:** Comprobar que TutorHub se recupera cuando el token de autenticación deja de ser válido.

**Procedimiento:**
1. Iniciar sesión como Creador.
2. Modificar el `access_token` almacenado en `localStorage`.
3. Recargar la aplicación con F5.
4. Observar las peticiones en Network.
5. Corregir la validación de la sesión y repetir la prueba.

**Petición:** GET al endpoint de autenticación `user`.

**Código HTTP observado:** 403.

**Respuesta:** Supabase rechazó la autenticación con el token inválido.

**Comportamiento antes de la corrección:** TutorHub mostraba errores de autorización y seguía indicando que la sesión estaba iniciada.

**Comportamiento después de la corrección:** TutorHub volvió al modo visitante, mostró los tutoriales publicados y permitió iniciar sesión nuevamente.

**Verificación adicional:** Después de otro F5, la aplicación permaneció en modo visitante y las consultas públicas devolvieron HTTP 200.

**Resultado:** Prueba satisfactoria. Se implementó la comprobación del usuario con `supabase.auth.getUser()` y la limpieza de la sesión inválida.

**Evidencias:**
- `capturas/caso4_error_inicial.png`
- `capturas/caso4.png`

---

## Pruebas pendientes

Los casos 3 y 5 se documentarán cuando se realicen sus pruebas.
