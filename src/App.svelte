
<script lang="ts">
  import { onMount } from "svelte";

  import Autenticacion from "./Autenticacion.svelte";
  import DetalleTutorial from "./DetalleTutorial.svelte";
  import Formulario from "./Formulario.svelte";

  import { supabase } from "./supabase";

  // Taller 10: máquina de estados.
  import {
    ESTADOS_TUTORIAL,
    nombreEstado,
    puedeCambiar,
  } from "./estado";

  // Taller 10: petición PATCH a Supabase.
  import { cambiarEstadoTutorial } from "./tutoriales";
  import { leerFiltro, guardarFiltro } from "./filtro";
  import type { FiltroTutorial } from "./filtro";

  import type {
    EstadoTutorial,
    FormatoTutorial,
    Rol,
    TutorialConCategoria,
  } from "./tipos";

  // Perfil del usuario autenticado.
  interface PerfilActual {
    id: number;
    rol: Rol;
  }

  // Datos de conexión con Supabase.
  const URL_BASE = import.meta.env.VITE_SUPABASE_URL;
  const CLAVE_PUBLICA =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;


  // 1. ESTADO DE LA APLICACIÓN


  let tutoriales = $state<TutorialConCategoria[]>([]);

  // Fase 3: filtro persistente de tutoriales.
  let filtro = $state<FiltroTutorial>("todos");

  // Mostrar solo los tutoriales que coinciden.
  let tutorialesFiltrados = $derived(
    filtro === "todos"
      ? tutoriales
      : tutoriales.filter(
          (tutorial) => tutorial.estado === filtro
        )
  );

  let tutorialSeleccionado =
    $state<TutorialConCategoria | null>(null);

  let sesionActiva = $state(false);

  // Identifica al usuario para evitar recargas
  // innecesarias al cambiar de pestaña.
  let usuarioActivoId = $state<string | null>(null);

  let perfilActual = $state<PerfilActual | null>(null);

  let cargando = $state(true);
  let error = $state("");
  let errorPerfil = $state("");

  // Aviso cuando el token guardado ya no es válido.
  let avisoSesion = $state("");

  // Estado para las modificaciones de tutoriales.
  let cambiandoId = $state<number | null>(null);
  let mensajeCambio = $state("");
  let errorCambio = $state("");


  // 2. CARGAR TUTORIALES DESDE SUPABASE


  async function cargarTutoriales(): Promise<void> {
    cargando = true;
    error = "";
    errorPerfil = "";
    perfilActual = null;

    try {
      if (!URL_BASE || !CLAVE_PUBLICA) {
        throw new Error(
          "Falta configurar la conexión con Supabase."
        );
      }

      // Recuperar la sesión guardada en el navegador.
      const {
        data: { session: sesionGuardada },
        error: errorSesion,
      } = await supabase.auth.getSession();

      if (errorSesion) {
        throw errorSesion;
      }

      let session = sesionGuardada;

      // Comprobar que el token sea válido en Supabase.
      if (session) {
        const {
          data: { user },
          error: errorUsuario,
        } = await supabase.auth.getUser();

        // No cerrar la sesión por errores de red o servidor.
        if (
          errorUsuario &&
          ![400, 401, 403].includes(errorUsuario.status ?? 0)
        ) {
          throw errorUsuario;
        }

        // Si el token es inválido, limpiar la sesión local.
        if (errorUsuario || !user) {
          await supabase.auth.signOut({ scope: "local" });

          session = null;
          tutorialSeleccionado = null;
          tutoriales = [];

          // Avisar y continuar con el listado público.
          avisoSesion =
            "Su sesión venció. Inicie sesión otra vez.";
        }
      }

      sesionActiva = Boolean(session);

      // Guardar el identificador de la sesión.
      usuarioActivoId = session?.user.id ?? null;

      const encabezados: Record<string, string> = {
        apikey: CLAVE_PUBLICA,
      };

      // Si existe sesión, enviar el token.
      if (session) {
        encabezados.Authorization =
          `Bearer ${session.access_token}`;

        // Consultar el perfil y rol del usuario.
        const urlPerfil =
          `${URL_BASE}/rest/v1/usuarios` +
          `?select=id,rol` +
          `&auth_user_id=eq.${session.user.id}`;

        const respuestaPerfil = await fetch(urlPerfil, {
          headers: encabezados,
        });

        if (respuestaPerfil.ok) {
          const perfiles =
            (await respuestaPerfil.json()) as PerfilActual[];

          if (perfiles.length > 0) {
            perfilActual = perfiles[0];
          } else {
            errorPerfil =
              "Esta cuenta no tiene un perfil de TutorHub asociado.";
          }
        } else {
          errorPerfil =
            "No se pudo comprobar el rol de la cuenta.";
        }
      }

      // Consultar tutoriales y sus categorías.
      const url =
        `${URL_BASE}/rest/v1/tutoriales` +
        `?select=*,categorias(nombre)` +
        `&order=fecha_creacion.desc`;

      const respuesta = await fetch(url, {
        headers: encabezados,
      });

      if (!respuesta.ok) {
        throw new Error(
          `Supabase respondió con error ${respuesta.status}`
        );
      }

      tutoriales =
        (await respuesta.json()) as TutorialConCategoria[];

    } catch (err) {
      error =
        err instanceof Error
          ? err.message
          : "No se pudieron cargar los tutoriales.";
    } finally {
      cargando = false;
    }
  }


  // 3. CONTROL DE LA SESIÓN


  onMount(() => {
    let componenteActivo = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (evento, nuevaSesion) => {

        // Solo atender cambios de inicio o cierre.
        if (
          evento !== "SIGNED_IN" &&
          evento !== "SIGNED_OUT"
        ) {
          return;
        }

        // Al iniciar sesión otra vez, quitar el aviso.
        if (evento === "SIGNED_IN") {
          avisoSesion = "";
        }

        const nuevoUsuarioId =
          nuevaSesion?.user.id ?? null;

        // CORRECCIÓN:
        // Si sigue siendo el mismo usuario,
        // no reconstruir el listado.
        if (nuevoUsuarioId === usuarioActivoId) {
          return;
        }

        // Recargar únicamente cuando cambie
        // realmente el usuario autenticado.
        setTimeout(() => {
          if (!componenteActivo) {
            return;
          }

          tutorialSeleccionado = null;
          tutoriales = [];
          perfilActual = null;

          mensajeCambio = "";
          errorCambio = "";

          void cargarTutoriales();
        }, 0);
      }
    );

    // Recuperar el filtro guardado.
    filtro = leerFiltro();

    // Carga inicial de la aplicación.
    void cargarTutoriales();

    // Limpiar la suscripción al desmontar.
    return () => {
      componenteActivo = false;
      subscription.unsubscribe();
    };
  });

  // 4. MOSTRAR FORMATOS

  function mostrarFormato(
    formato: FormatoTutorial
  ): string {
    if (formato === "paso-a-paso") {
      return "Paso a paso";
    }

    if (formato === "video") {
      return "Video";
    }

    return "Interactivo";
  }

  // 5. TRANSICIONES PERMITIDAS POR ROL

  function estadosPermitidos(
    tutorial: TutorialConCategoria
  ): EstadoTutorial[] {
    const perfil = perfilActual;

    if (!perfil) {
      return [];
    }

    // El Creador solo puede modificar
    // sus propios tutoriales.
    if (
      perfil.rol === "Creador" &&
      perfil.id !== tutorial.autor_id
    ) {
      return [];
    }

    // Consultar la máquina de estados.
    return ESTADOS_TUTORIAL.filter((nuevo) =>
      puedeCambiar(
        tutorial.estado,
        nuevo,
        perfil.rol
      )
    );
  }


  // 6. COMPROBAR PASOS DEL TUTORIAL


  async function tienePasos(
    idTutorial: number
  ): Promise<boolean> {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error(
        "Inicie sesión para enviar tutoriales a revisión."
      );
    }

    const url =
      `${URL_BASE}/rest/v1/pasos_tutorial` +
      `?select=id&tutorial_id=eq.${idTutorial}&limit=1`;

    const respuesta = await fetch(url, {
      headers: {
        apikey: CLAVE_PUBLICA,
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (!respuesta.ok) {
      throw new Error(
        "No se pudieron comprobar los pasos del tutorial."
      );
    }

    const pasos =
      (await respuesta.json()) as { id: number }[];

    return pasos.length > 0;
  }


  // 7. CAMBIAR ESTADO EN SUPABASE


  async function cambiarEstado(
    tutorial: TutorialConCategoria,
    nuevo: EstadoTutorial
  ): Promise<void> {

    // Evitar modificaciones simultáneas
    // desde esta pantalla.
    if (cambiandoId !== null) {
      return;
    }

    mensajeCambio = "";
    errorCambio = "";

    // Comprobar que la transición esté permitida.
    if (!estadosPermitidos(tutorial).includes(nuevo)) {
      errorCambio =
        "Su cuenta no puede realizar este cambio de estado.";
      return;
    }

    cambiandoId = tutorial.id;

    try {
      // Regla del Hito 1:
      // un tutorial debe tener al menos un paso
      // antes de enviarse a revisión.
      if (
        tutorial.estado === "borrador" &&
        nuevo === "en_revision"
      ) {
        const tieneAlMenosUnPaso =
          await tienePasos(tutorial.id);

        if (!tieneAlMenosUnPaso) {
          errorCambio =
            "El tutorial necesita al menos un paso antes " +
            "de enviarse a revisión.";
          return;
        }
      }

      // Primero modificar la fuente de verdad:
      // Supabase.
      const resultado = await cambiarEstadoTutorial(
        tutorial.id,
        tutorial.estado,
        nuevo
      );

      // Comprobar la respuesta HTTP.
      if (resultado.codigo !== 200) {
        errorCambio =
          "Supabase no permitió cambiar el tutorial " +
          `(HTTP ${resultado.codigo}). ` +
          (resultado.detalleError ?? "");

        return;
      }

      // HTTP 200 con [] no significa éxito.
      if (resultado.filas.length !== 1) {

        // Actualizar el listado desde la base.
        await cargarTutoriales();

        errorCambio =
          "No se modificó el tutorial. Puede que no " +
          "tenga permiso o que otra persona haya " +
          "cambiado su estado. Se actualizó el listado.";

        return;
      }

      // Supabase confirmó una fila modificada.
      const estadoConfirmado =
        resultado.filas[0].estado;

      // Ahora sí actualizar la copia en memoria.
      tutoriales = tutoriales.map((item) =>
        item.id === tutorial.id
          ? {
              ...item,
              estado: estadoConfirmado,
            }
          : item
      );

      // Sincronizar el detalle si está abierto.
      if (
        tutorialSeleccionado?.id === tutorial.id
      ) {
        tutorialSeleccionado = {
          ...tutorialSeleccionado,
          estado: estadoConfirmado,
        };
      }

      mensajeCambio =
        `El tutorial «${tutorial.titulo}» pasó a ` +
        `«${nombreEstado(estadoConfirmado)}».`;

    } catch (err) {
      errorCambio =
        err instanceof Error
          ? err.message
          : "No se pudo cambiar el estado del tutorial.";
    } finally {
      cambiandoId = null;
    }
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
    {sesionActiva
      ? "Tutoriales visibles para mí"
      : "Tutoriales publicados"}
  </h1>

  <!-- Aviso de sesión vencida -->
  {#if avisoSesion}
    <p role="alert" class="mensaje-error">
      {avisoSesion}
    </p>
  {/if}

  <!-- Mensaje de error al consultar el perfil -->
  {#if errorPerfil}
    <p role="alert" class="mensaje-error">
      {errorPerfil}
    </p>
  {/if}

  <!-- Fase 3: filtro persistente -->
  <div>
    <label for="filtro-estado">Filtrar por estado:</label>

    <select
      id="filtro-estado"
      value={filtro}
      onchange={(evento) => {
        const seleccionado =
          evento.currentTarget.value as FiltroTutorial;

        filtro = seleccionado;
        guardarFiltro(seleccionado);
      }}
    >
      <option value="todos">Todos</option>
      <option value="borrador">Borrador</option>
      <option value="en_revision">En revisión</option>
      <option value="publicado">Publicado</option>
    </select>
  </div>

  <!-- Listado de tutoriales -->
  {#if cargando}
    <p role="status">
      Cargando tutoriales desde Supabase...
    </p>

  {:else if error}
    <p role="alert" class="mensaje-error">
      Error al cargar: {error}
    </p>

    <button
      type="button"
      onclick={cargarTutoriales}
    >
      Reintentar
    </button>

  {:else if tutoriales.length === 0}
    <p>
      {sesionActiva
        ? "No hay tutoriales disponibles."
        : "No hay tutoriales publicados."}
    </p>

  {:else if tutorialesFiltrados.length === 0}
    <p role="status">
      Ningún tutorial coincide con el filtro seleccionado.
    </p>

  {:else}
    <table>
      <caption>
        Listado de tutoriales obtenidos desde Supabase
      </caption>

      <thead>
        <tr>
          <th scope="col">Título</th>
          <th scope="col">Categoría</th>
          <th scope="col">Formato</th>
          <th scope="col">Estado</th>
          <th scope="col">Acción</th>
          <th scope="col">Cambiar estado</th>
        </tr>
      </thead>

      <tbody>
        {#each tutorialesFiltrados as tutorial (tutorial.id)}
          <tr>
            <td>
              {tutorial.titulo}
            </td>

            <td>
              {tutorial.categorias?.nombre ??
                "Sin categoría"}
            </td>

            <td>
              {mostrarFormato(tutorial.formato)}
            </td>

            <td>
              {nombreEstado(tutorial.estado)}
            </td>

            <!-- Botón para ver el detalle -->
            <td>
              <button
                type="button"
                aria-label="Ver detalle de {tutorial.titulo}"
                onclick={() =>
                  (tutorialSeleccionado = tutorial)}
              >
                Ver detalle
              </button>
            </td>

            <!-- Botones para cambiar el estado -->
            <td>
              {#each estadosPermitidos(tutorial) as nuevo (nuevo)}
                <button
                  type="button"
                  disabled={cambiandoId !== null}
                  onclick={() =>
                    void cambiarEstado(tutorial, nuevo)}
                >
                  {cambiandoId === tutorial.id
                    ? "Guardando..."
                    : `Pasar a ${nombreEstado(nuevo)}`}
                </button>
              {:else}
                <span>
                  Sin acciones disponibles
                </span>
              {/each}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}

  <!-- Mensaje de éxito -->
  {#if mensajeCambio}
    <p role="status" class="mensaje-exito">
      {mensajeCambio}
    </p>
  {/if}

  <!-- Mensaje de error -->
  {#if errorCambio}
    <p role="alert" class="mensaje-error">
      {errorCambio}
    </p>
  {/if}

  <!-- Detalle del tutorial -->
  {#if tutorialSeleccionado}
    {#key tutorialSeleccionado.id}
      <DetalleTutorial
        tutorial={tutorialSeleccionado}
        onVolver={() =>
          (tutorialSeleccionado = null)}
      />
    {/key}
  {/if}

  <!-- Autenticación -->
  <Autenticacion />

  <!-- Formulario de creación -->
  <Formulario
    onTutorialCreado={() =>
      void cargarTutoriales()}
  />
</main>
