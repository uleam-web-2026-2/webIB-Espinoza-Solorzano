<script lang="ts">
  import { onMount } from 'svelte';
  import type {
    EstadoTutorial,
    FormatoTutorial,
    PasoTutorial,
    TutorialConCategoria,
  } from './tipos';

  // Datos recibidos desde App.svelte
  let {
    tutorial,
    onVolver,
  }: {
    tutorial: TutorialConCategoria;
    onVolver: () => void;
  } = $props();

  let pasos = $state<PasoTutorial[]>([]);
  let cargando = $state(true);
  let error = $state('');

  function mostrarFormato(formato: FormatoTutorial): string {
    if (formato === 'paso-a-paso') return 'Paso a paso';
    if (formato === 'video') return 'Video';
    return 'Interactivo';
  }

  function mostrarEstado(estado: EstadoTutorial): string {
    if (estado === 'borrador') return 'Borrador';
    if (estado === 'en_revision') return 'En revisión';
    return 'Publicado';
  }

  async function cargarPasos(): Promise<void> {
    cargando = true;
    error = '';

    try {
      const base = import.meta.env.VITE_SUPABASE_URL;
      const clave = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      if (!base || !clave) {
        throw new Error('Falta configurar Supabase.');
      }

      // Obtener únicamente los pasos del tutorial elegido en orden ascendente
      const url =
        `${base}/rest/v1/pasos_tutorial` +
        `?tutorial_id=eq.${tutorial.id}` +
        `&select=*&order=orden.asc`;

      const respuesta = await fetch(url, {
        method: 'GET',
        headers: {
          apikey: clave,
        },
      });

      if (!respuesta.ok) {
        throw new Error(
          `Error al obtener los pasos: HTTP ${respuesta.status}`
        );
      }

      pasos = (await respuesta.json()) as PasoTutorial[];
    } catch (err) {
      error =
        err instanceof Error
          ? err.message
          : 'No se pudieron cargar los pasos.';
    } finally {
      cargando = false;
    }
  }

  onMount(() => {
    void cargarPasos();
  });
</script>

<section class="detalle-tutorial" aria-labelledby="titulo-detalle">
  <h2 id="titulo-detalle">Detalle del tutorial</h2>

  <button type="button" onclick={onVolver}>
    Cerrar detalle
  </button>

  <h3>{tutorial.titulo}</h3>

  <p>
    <strong>Descripción:</strong>
    {tutorial.descripcion ?? 'Sin descripción'}
  </p>

  <p>
    <strong>Categoría:</strong>
    {tutorial.categorias?.nombre ?? 'Sin categoría'}
  </p>

  <p>
    <strong>Formato:</strong>
    {mostrarFormato(tutorial.formato)}
  </p>

  <p>
    <strong>Estado:</strong>
    {mostrarEstado(tutorial.estado)}
  </p>

  <h3>Pasos del tutorial</h3>

  {#if cargando}
    <p role="status">Cargando pasos desde Supabase...</p>
  {:else if error}
    <p role="alert" class="mensaje-error">{error}</p>
    <button type="button" onclick={cargarPasos}>Reintentar</button>
  {:else if pasos.length === 0}
    <p>Este tutorial todavía no tiene pasos.</p>
  {:else}
    <ol>
      {#each pasos as paso (paso.id)}
        <li>
          <p>{paso.instruccion}</p>
        </li>
      {/each}
    </ol>
  {/if}
</section>

