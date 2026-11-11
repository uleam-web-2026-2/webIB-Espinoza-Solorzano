## Decisión 1 la tabla en pantalla estrecha

Elegimos transformar cada fila de la tabla en un bloque individual y ocultar la cabecera cuando se abra en un celular.
Para el rol Creador de tutoriales, la consecuencia es que puede leer sus tutoriales hacia abajo cómodamente como si fueran tarjetas, sin tener que arrastrar la pantalla hacia los lados.
Lo que se pierde es que en el teléfono no se ven los nombres de las columnas arriba, así que los datos quedan sueltos y tocará etiquetarlos mejor más adelante.

## Decisión 2 columnas visibles en el listado

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

- `taller10/capturas/fase3_filtro_persistente.png`
- `taller10/capturas/fase3_filtro_invalido.png`
- `taller10/capturas/fase3_sin_coincidencias.png`
