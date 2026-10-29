<script lang="ts">
  import { onMount } from "svelte";
  import Autenticacion from "./Autenticacion.svelte";
  import DetalleTutorial from "./DetalleTutorial.svelte";
  import Formulario from "./Formulario.svelte";
  import { supabase } from "./supabase";
  import type {
    EstadoTutorial,
    FormatoTutorial,
    TutorialConCategoria,
  } from "./tipos";

  // Datos de conexión con Supabase
  const URL_BASE = import.meta.env.VITE_SUPABASE_URL;
  const CLAVE_PUBLICA = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  // Estado de la aplicación
  let tutoriales = $state<TutorialConCategoria[]>([]);
  let tutorialSeleccionado = $state<TutorialConCategoria | null>(null);
  let sesionActiva = $state(false);
  let cargando = $state(true);
  let error = $state("");

  // Consultar los tutoriales en Supabase
  async function cargarTutoriales(): Promise<void> {
    cargando = true;
    error = "";

    try {
      if (!URL_BASE || !CLAVE_PUBLICA) {
        throw new Error("Falta configurar la conexión con Supabase.");
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      sesionActiva = Boolean(session);

      const encabezados: Record<string, string> = {
        apikey: CLAVE_PUBLICA,
      };

      if (session) {
        encabezados.Authorization = `Bearer ${session.access_token}`;
      }

      const url =
        `${URL_BASE}/rest/v1/tutoriales` +
        `?select=*,categorias(nombre)` +
        `&order=fecha_creacion.desc`;

      const respuesta = await fetch(url, {
        headers: encabezados,
      });

      if (!respuesta.ok) {
        throw new Error(`Supabase respondió con error ${respuesta.status}`);
      }

      tutoriales = (await respuesta.json()) as TutorialConCategoria[];
    } catch (err) {
      error =
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los tutoriales.";
    } finally {
      cargando = false;
    }
  }

  // Ejecutar la consulta cuando abre la aplicación y ante cambios de sesión
  onMount(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((evento) => {
      if (evento !== "SIGNED_IN" && evento !== "SIGNED_OUT") return;

      setTimeout(() => {
        tutorialSeleccionado = null;
        tutoriales = [];
        void cargarTutoriales();
      }, 0);
    });

    void cargarTutoriales();

    return () => {
      subscription.unsubscribe();
    };
  });

  // Mostrar los formatos de manera legible
  function mostrarFormato(formato: FormatoTutorial): string {
    if (formato === "paso-a-paso") return "Paso a paso";
    if (formato === "video") return "Video";
    return "Interactivo";
  }

  // Mostrar los estados como texto
  function mostrarEstado(estado: EstadoTutorial): string {
    if (estado === "borrador") return "Borrador";
    if (estado === "en_revision") return "En revisión";
    return "Publicado";
  }
</script>

<header>
  <p>TutorHub</p>

  <nav aria-label="Principal">
    <a href="#tutoriales">Tutoriales</a>
    <a href="#titulo-auth">Acceso</a>
    <a href="#titulo-nuevo">Nuevo tutorial</a>
  </nav>
</header>

<main>
  <h1 id="tutoriales">
    {sesionActiva ? "Tutoriales visibles para mí" : "Tutoriales publicados"}
  </h1>

  {#if cargando}
    <p role="status">Cargando tutoriales desde Supabase...</p>
  {:else if error}
    <p role="alert" class="mensaje-error">
      Error al cargar: {error}
    </p>
    <button type="button" onclick={cargarTutoriales}>Reintentar</button>
  {:else if tutoriales.length === 0}
    <p>
      {sesionActiva
        ? "No hay tutoriales disponibles."
        : "No hay tutoriales publicados."}
    </p>
  {:else}
    <table>
      <caption>Listado de tutoriales obtenidos desde Supabase</caption>

      <thead>
        <tr>
          <th scope="col">Título</th>
          <th scope="col">Categoría</th>
          <th scope="col">Formato</th>
          <th scope="col">Estado</th>
          <th scope="col">Acción</th>
        </tr>
      </thead>

      <tbody>
        {#each tutoriales as tutorial (tutorial.id)}
          <tr>
            <td>{tutorial.titulo}</td>
            <td>
              {tutorial.categorias?.nombre ?? "Sin categoría"}
            </td>
            <td>{mostrarFormato(tutorial.formato)}</td>
            <td>{mostrarEstado(tutorial.estado)}</td>
            <td>
              <button
                type="button"
                aria-label="Ver detalle de {tutorial.titulo}"
                onclick={() => (tutorialSeleccionado = tutorial)}
              >
                Ver detalle
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}

  {#if tutorialSeleccionado}
    {#key tutorialSeleccionado.id}
      <DetalleTutorial
        tutorial={tutorialSeleccionado}
        onVolver={() => (tutorialSeleccionado = null)}
      />
    {/key}
  {/if}

  <Autenticacion />

  <Formulario onTutorialCreado={() => void cargarTutoriales()} />
</main>
