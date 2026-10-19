<script lang="ts">
  let titulo = $state('');
  let categoria = $state('');
  let formato = $state('');
  let descripcion = $state('');

  let submitted = $state(false);
  let mensajeExito = $state('');

  let errorTitulo = $derived(submitted && titulo.trim() === '');
  let errorCategoria = $derived(submitted && categoria === '');
  let errorFormato = $derived(submitted && formato === '');

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    submitted = true;

    if (titulo.trim() === '' || categoria === '' || formato === '') {
      return;
    }

    mensajeExito = `¡Tutorial "${titulo}" creado con éxito en estado Borrador!`;
    
    // Reiniciar campos
    titulo = '';
    categoria = '';
    formato = '';
    descripcion = '';
    submitted = false;

    setTimeout(() => {
      mensajeExito = '';
    }, 4000);
  }
</script>

<section aria-labelledby="titulo-nuevo">
  <h2 id="titulo-nuevo">Nuevo tutorial</h2>

  <form onsubmit={handleSubmit} novalidate>

    <!-- Campo 1: Título (obligatorio) -->
    <label for="titulo">Título del tutorial</label>
    <input
      type="text"
      id="titulo"
      name="titulo"
      bind:value={titulo}
      required
      aria-invalid={errorTitulo ? "true" : "false"}
      aria-describedby={errorTitulo ? "titulo-error" : undefined}
    >

    {#if errorTitulo}
      <p id="titulo-error" class="mensaje-error">
        Error: Ingrese el título del tutorial para continuar.
      </p>
    {/if}

    <!-- Campo 2: Categoría (obligatorio) -->
    <label for="categoria">Categoría</label>
    <select
      id="categoria"
      name="categoria"
      bind:value={categoria}
      required
      aria-invalid={errorCategoria ? "true" : "false"}
      aria-describedby={errorCategoria ? "categoria-error" : undefined}
    >
      <option value="">Seleccione una categoría</option>
      <option value="programacion">Programación</option>
      <option value="diseno">Diseño</option>
      <option value="bases-datos">Bases de datos</option>
    </select>

    {#if errorCategoria}
      <p id="categoria-error" class="mensaje-error">
        Error: Seleccione una categoría para clasificar el tutorial.
      </p>
    {/if}

    <!-- Campo 3: Formato (obligatorio) -->
    <label for="formato">Formato</label>
    <select
      id="formato"
      name="formato"
      bind:value={formato}
      required
      aria-invalid={errorFormato ? "true" : "false"}
      aria-describedby={errorFormato ? "formato-error" : undefined}
    >
      <option value="">Seleccione un formato</option>
      <option value="paso-a-paso">Paso a paso</option>
      <option value="video">Video</option>
      <option value="interactivo">Interactivo</option>
    </select>

    {#if errorFormato}
      <p id="formato-error" class="mensaje-error">
        Error: Seleccione el formato del tutorial.
      </p>
    {/if}

    <!-- Campo 4: Descripción (opcional) -->
    <label for="descripcion">Descripción o resumen</label>
    <input
      type="text"
      id="descripcion"
      name="descripcion"
      bind:value={descripcion}
    >

    <!-- Botón de envío nativo -->
    <button type="submit">Crear tutorial</button>

    {#if mensajeExito}
      <p class="mensaje-exito" role="status" aria-live="polite">
        {mensajeExito}
      </p>
    {/if}

  </form>
</section>
