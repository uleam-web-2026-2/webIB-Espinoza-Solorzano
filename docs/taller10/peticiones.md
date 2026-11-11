
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

## Pruebas pendientes

Los casos 3, 4 y 5 se incorporarán cuando se realicen sus pruebas correspondientes.

No se registrarán resultados ni códigos HTTP que todavía no se hayan comprobado.
