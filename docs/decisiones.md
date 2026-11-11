# Decisiones de diseño — TutorHub

## Decisión 1 — La tabla en pantalla estrecha

Elegimos transformar cada fila de la tabla en un bloque individual y ocultar la cabecera cuando se abra en un celular.

Para el rol Creador de tutoriales, la consecuencia es que puede leer sus tutoriales hacia abajo cómodamente como si fueran tarjetas, sin tener que arrastrar la pantalla hacia los lados.

Lo que se pierde es que en el teléfono no se ven los nombres de las columnas arriba, así que los datos quedan sueltos y tocará etiquetarlos mejor más adelante.

## Decisión 2 — Columnas visibles en el listado

Elegimos mostrar solo Título, Categoría, Formato, Estado y Acción, dejando fuera la descripción larga, la fecha y el nombre del autor.

Para el rol Creador de tutoriales, la consecuencia es ver de un vistazo qué tutoriales tiene listos y cuáles le falta enviar a revisión, sin llenar la pantalla de texto innecesario.

Lo que se pierde es que el creador no puede leer los detalles completos del tutorial desde esta lista y debe abrirlo para ver toda su información.

## Decisión 3 — Persistencia del filtro de tutoriales

Elegimos guardar el filtro por estado en `localStorage` porque es una preferencia del usuario y no un dato del negocio. Así, la selección se mantiene después de recargar la página.

Si el valor guardado no corresponde a un estado válido, la aplicación utiliza automáticamente la opción "Todos".

La ventaja es que el filtro se conserva sin necesidad de configurar una base de datos. Lo que se pierde frente a guardarlo en la URL es que no podemos compartir directamente un enlace con el filtro seleccionado.

### Pruebas realizadas

- El filtro "Borrador" permanece seleccionado después de recargar.
- Un valor inventado en `localStorage` hace que se seleccione "Todos".
- Cuando ningún tutorial coincide con el filtro, aparece un mensaje informativo.

### Evidencias

- `docs/taller10/capturas/fase3_filtro_persistente.png`
- `docs/taller10/capturas/fase3_filtro_invalido.png`
- `docs/taller10/capturas/fase3_sin_coincidencias.png`

## Decisión 4 — Persistencia del borrador del formulario

Para evitar que una persona pierda lo que está escribiendo al recargar TutorHub, decidimos guardar temporalmente el borrador del formulario en `sessionStorage`.

El borrador contiene únicamente los campos necesarios para crear un tutorial:

- Título.
- Categoría.
- Formato.
- Descripción.

La información se almacena como JSON mediante la clave `tutorhub.borrador` y se recupera al volver a cargar la aplicación.

Elegimos `sessionStorage` en lugar de `localStorage` porque el borrador corresponde al trabajo temporal realizado en una pestaña concreta. No necesitamos conservarlo indefinidamente ni compartirlo entre todas las pestañas.

También decidimos que el borrador solo debe eliminarse cuando Supabase confirme la creación del tutorial. Si la petición falla o el servidor rechaza la operación, los campos permanecen completos para que el usuario pueda corregir el problema e intentarlo nuevamente.

Esto evita que una respuesta de error provoque la pérdida innecesaria de información.

### Alternativas consideradas

**Alternativa 1: guardar el borrador únicamente en memoria.**

Se descartó porque los campos perderían su contenido al recargar la página.

**Alternativa 2: utilizar `localStorage`.**

Permitía conservar los datos incluso después de cerrar el navegador, pero no era necesario para este caso. Además, el borrador podría permanecer guardado más tiempo del deseado y estar disponible para otras pestañas del mismo origen.

**Solución elegida: `sessionStorage`.**

Se ajusta mejor al comportamiento esperado: conservar temporalmente lo escrito dentro de la misma pestaña y eliminarlo tras una creación exitosa.

### Pruebas realizadas

1. Se completaron los cuatro campos del formulario y se presionó F5. Todos los valores fueron recuperados correctamente.
2. Se abrió TutorHub en una pestaña nueva independiente y se comprobó que no apareciera el borrador anterior.
3. Se intentó crear un tutorial sin iniciar sesión. Supabase respondió HTTP 401, TutorHub mostró el error y los campos conservaron sus valores.
4. Se inició sesión con una cuenta Creador y se realizó una creación exitosa. Supabase respondió HTTP 201, los campos quedaron vacíos y la clave `tutorhub.borrador` desapareció de `sessionStorage`.

### Archivos relacionados

- `src/Formulario.svelte`

### Evidencias

- `docs/taller10/capturas/fase4_borrador_recuperado.png`
- `docs/taller10/capturas/fase4_borrador_error.png`
- `docs/taller10/capturas/fase4_borrador_eliminado.png`

---

## Semana 10 · dónde vive cada cosa

La principal decisión de esta semana consiste en distinguir los datos del negocio, los datos de sesión y las preferencias temporales de la interfaz.

No toda la información debe almacenarse en el mismo lugar. Elegimos cada mecanismo considerando quién necesita los datos, cuánto tiempo deben mantenerse y cuál es su fuente de verdad.

| Dato | Clase | Dónde vive | Por qué ahí | Qué arriesga |
| --- | --- | --- | --- | --- |
| Tutoriales y sus estados | Negocio | Supabase, tabla `tutoriales` | Son registros compartidos entre creadores y revisores. Sus cambios deben permanecer después de recargar y ser visibles para otros usuarios autorizados. | Si se modifica únicamente la copia del navegador, el cambio se pierde o puede quedar desactualizado respecto a la base de datos. |
| Token de autenticación | Sesión | Almacenamiento local gestionado por Supabase Auth (`localStorage`) | Permite recuperar la sesión tras recargar la página, sin solicitar las credenciales en cada actualización. | Un token alterado o vencido puede provocar errores de autenticación. Además, debe protegerse frente a accesos no autorizados al navegador. |
| Filtro por estado | Interfaz | `localStorage`, clave `tutorhub.filtro.estado` | Es una preferencia de visualización que conviene conservar al recargar. No modifica los tutoriales guardados en Supabase. | Puede quedar un valor antiguo o inválido, por lo que debe validarse y utilizar "Todos" como alternativa segura. |
| Borrador del formulario | Interfaz | `sessionStorage`, clave `tutorhub.borrador` | Es información temporal de una pestaña. Debe sobrevivir a una recarga, pero eliminarse cuando se crea correctamente el tutorial. | Puede perderse al finalizar la sesión de la pestaña. Si no se limpia después de crear, podría reaparecer un borrador ya enviado. |

### Criterio utilizado

La fuente de verdad de los tutoriales es **Supabase**. El listado que aparece en pantalla es una copia utilizada para mostrar los datos y permitir la interacción.

La sesión sirve para identificar al usuario autenticado y enviar las peticiones con su token. Las políticas RLS de Supabase son las que deben determinar si una operación está autorizada; ocultar un botón en la interfaz no sustituye esa validación.

El filtro y el borrador son datos propios de la experiencia de uso. Por eso no necesitan almacenarse como registros adicionales en las tablas del negocio.

Esta separación evita guardar información innecesaria en la base de datos y reduce el riesgo de confundir una preferencia local con un dato compartido.

---

### La copia vieja

#### Problema identificado

En TutorHub, dos revisores pueden consultar el mismo tutorial y mantener abierta una copia de su estado.

El problema aparece cuando uno de ellos modifica el tutorial mientras el otro continúa trabajando con información desactualizada.

Por ejemplo, ambos revisores consultan un tutorial cuyo estado inicial es `en_revision`.

El Revisor B lo aprueba y cambia su estado a `publicado`. Sin embargo, el Revisor A no ha recargado la página y todavía observa `en_revision`.

Si A intenta devolverlo a `borrador`, una actualización que solo compruebe el identificador podría sobrescribir el estado `publicado` confirmado anteriormente por B.

Esto sería incorrecto, porque la decisión de A estaría basada en una versión antigua del registro.

La máquina de estados valida las transiciones utilizando los datos que tiene la interfaz, pero esa copia puede haber quedado desactualizada. Por sí sola, no garantiza que el estado actual en Supabase siga siendo el mismo.

#### Alternativa 1 — Consultar el estado antes de cada actualización

Una posibilidad era realizar una petición `GET` inmediatamente antes de cada `PATCH`.

Primero se consultaría el estado actual del tutorial y, si coincide con el esperado, se enviaría la modificación.

**Ventaja:** permite detectar determinados cambios realizados por otros usuarios antes de intentar modificar el registro.

**Desventaja:** entre el `GET` y el `PATCH`, otra persona todavía podría modificar el tutorial.

Por tanto, consultar antes no elimina completamente el problema de concurrencia. También requiere una petición adicional.

Descartamos esta alternativa como solución principal porque la comprobación y la actualización deben depender de una misma condición aplicada directamente por la base de datos.

#### Alternativa 2 — Recargar periódicamente el listado

Otra posibilidad era actualizar automáticamente el listado cada cierto tiempo.

**Ventaja:** permite mostrar datos más recientes sin intervención del usuario.

**Desventaja:** no evita que una persona intente modificar un tutorial durante el intervalo entre dos recargas.

También introduce consultas adicionales y no garantiza que la información continúe vigente en el instante exacto de guardar.

La descartamos como mecanismo de protección contra modificaciones basadas en copias antiguas.

#### Alternativa 3 — PATCH condicionado al estado anterior

**Esta fue la solución elegida.**

Decidimos utilizar una actualización condicional mediante la API REST de Supabase/PostgREST.

La petición identifica el tutorial y exige que todavía tenga el estado observado originalmente por la persona que intenta modificarlo.

La condición utiliza dos filtros:

- `id=eq.<id>`: identifica el tutorial que se desea modificar.
- `estado=eq.<estadoActual>`: exige que su estado siga coincidiendo con la copia utilizada por la interfaz.

Por ejemplo, si un Revisor intenta devolver a borrador un tutorial que vio en revisión, la petición incluye:

```http
PATCH /rest/v1/tutoriales?id=eq.6&estado=eq.en_revision&select=*
```

El cuerpo enviado contiene:

```json
{
  "estado": "borrador"
}
```

También se utiliza la cabecera:

```http
Prefer: return=representation
```

Esta cabecera permite recibir las filas realmente modificadas.

La actualización solo puede afectar al tutorial cuando se cumplen las condiciones del filtro.

Si otro Revisor ya cambió el estado a `publicado`, el filtro `estado=eq.en_revision` deja de coincidir y Supabase no modifica la fila.

#### Interpretación de la respuesta

No consideramos suficiente comprobar únicamente `respuesta.ok`, porque una respuesta HTTP exitosa no necesariamente significa que se haya actualizado un registro.

Diferenciamos dos situaciones:

**Actualización confirmada**

Supabase responde HTTP 200 y devuelve una fila modificada. Entonces TutorHub actualiza su copia local con el estado confirmado por el servidor y muestra un mensaje de éxito.

**Actualización sin filas afectadas**

Supabase responde HTTP 200 con:

```json
[]
```

Esto significa que ninguna fila fue modificada. Puede ocurrir porque el estado ya cambió o porque las políticas de acceso impidieron actualizarla.

En este caso, TutorHub no informa que el cambio se haya guardado. Vuelve a consultar los tutoriales en Supabase y muestra un aviso para explicar lo ocurrido.

La respuesta vacía no permite distinguir por sí sola entre un conflicto de estado y una restricción de permisos. Por eso el mensaje contempla ambas posibilidades.

#### ¿Qué ocurre ahora en la pantalla de la persona A?

Cuando A intenta realizar un cambio utilizando información antigua:

1. TutorHub envía el `PATCH` condicionado al identificador y al estado anterior.
2. Supabase comprueba la condición sobre los datos actuales.
3. Si el estado ya no coincide, ninguna fila es modificada.
4. TutorHub interpreta la respuesta vacía como una operación no confirmada.
5. La aplicación vuelve a cargar los tutoriales desde Supabase.
6. A observa el estado actualizado y recibe un mensaje de advertencia.

De esta forma, la pantalla deja de depender de una copia antigua y vuelve a sincronizarse con la fuente de verdad.

Además, se conserva el manejo de permisos implementado durante la fase 1: una actualización sin filas afectadas no se presenta como un éxito.

#### Implementación en TutorHub

La protección se encuentra principalmente en:

- `src/tutoriales.ts`: construye la petición `PATCH` con los filtros por identificador y estado anterior, y devuelve el código HTTP junto con las filas modificadas.
- `src/App.svelte`: comprueba la respuesta, actualiza la copia local únicamente cuando Supabase confirma la modificación y vuelve a cargar los tutoriales cuando no se modifica ninguna fila.
- `src/estado.ts`: contiene las transiciones permitidas según el estado y el rol del usuario.

No se añadieron bibliotecas para resolver este problema. La actualización se realiza mediante `fetch` y la API REST de Supabase/PostgREST.

#### Prueba realizada con dos revisores

Se prepararon dos cuentas diferentes con rol `Revisor`, vinculadas con sus correspondientes perfiles de TutorHub:

- Revisor A: `pepetola@gmail.com`, utilizando Brave.
- Revisor B: `carawita@gmail.com`, utilizando Chrome.

Ambos consultaron el tutorial **«tutorial de prueba»**, identificado con el ID `6`, mientras se encontraba en estado `en_revision`.

**Procedimiento:**

1. El Revisor A dejó abierto el listado sin actualizarlo.
2. El Revisor B cambió el tutorial a `publicado`.
3. El Revisor A, que todavía veía `en_revision`, intentó devolver el tutorial a `borrador`.
4. En la pestaña Network de Brave se observó una petición `PATCH` con el filtro `estado=eq.en_revision`.
5. Supabase respondió HTTP 200 con un arreglo vacío `[]`.
6. TutorHub mostró el mensaje de advertencia y actualizó el listado.
7. En Supabase Table Editor se comprobó que el tutorial ID `6` continuaba en estado `publicado`.

**Resultado:** la modificación basada en información desactualizada no sobrescribió el estado confirmado por el segundo Revisor.

#### Evidencias

- `docs/taller10/capturas/caso5.png`: petición `PATCH`, respuesta vacía, mensaje de advertencia y listado actualizado en TutorHub.
- `docs/taller10/capturas/caso5_supabase.png`: comprobación del estado `publicado` del tutorial ID `6` en la tabla `tutoriales`.

#### Conclusión de la decisión

Elegimos el `PATCH` condicionado al estado anterior porque permite comprobar el estado esperado y realizar la actualización en una misma operación sobre la fuente de verdad.

Esta solución es más segura frente a modificaciones concurrentes que comprobar solamente los datos de la interfaz o realizar una consulta previa separada.

El principio aplicado es:

**Primero se confirma el cambio en Supabase y después se actualiza la copia mostrada por TutorHub.**

Si la actualización no afecta ninguna fila, la aplicación no supone que tuvo éxito: informa al usuario y recupera los datos vigentes.

Así evitamos que una copia desactualizada sobrescriba silenciosamente los cambios realizados por otro Revisor.