<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from './supabase';
  import type {
    Categoria,
    EstadoTutorial,
    FormatoTutorial,
    Rol,
  } from './tipos';

  let {
    onTutorialCreado,
  }: {
    onTutorialCreado?: () => void;
  } = $props();

  const URL_BASE = import.meta.env.VITE_SUPABASE_URL;
  const CLAVE = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  let titulo = $state('');
  let categoria = $state('');
  let formato = $state('');
  let descripcion = $state('');

  let categorias = $state<Categoria[]>([]);
  let cargandoCategorias = $state(true);
  let errorCategorias = $state('');

  let submitted = $state(false);
  let procesando = $state(false);
  let mensajeExito = $state('');
  let errorServidor = $state('');

  // Validaciones de cliente (Demostración 3)
  let errorTitulo = $derived(submitted && titulo.trim() === '');
  let errorCategoria = $derived(submitted && categoria === '');
  let errorFormato = $derived(submitted && formato === '');

  function traducirRechazoServidor(status: number, mensaje?: string): string {
    const texto = (mensaje ?? '').toLowerCase();

    if (texto.includes('permission denied')) {
      return `Supabase rechazó la creación (HTTP ${status}): no tiene permisos de inserción sin iniciar sesión.`;
    }

    if (texto.includes('row-level security policy')) {
      return `Supabase rechazó la creación (HTTP ${status}): la política de seguridad (RLS) no autoriza esta operación.`;
    }

    if (status === 401 || status === 403) {
      return `Supabase rechazó la creación (HTTP ${status}): operación no autorizada. Inicie sesión como Creador.`;
    }

    return (
      `Supabase rechazó la creación (HTTP ${status}). ` +
      (mensaje ?? 'Operación no autorizada.')
    );
  }

  // Obtener categorías reales desde Supabase
  async function cargarCategorias(): Promise<void> {
    cargandoCategorias = true;
    errorCategorias = '';

    try {
      if (!URL_BASE || !CLAVE) {
        throw new Error('Falta configurar la conexión con Supabase.');
      }

      const respuesta = await fetch(
        `${URL_BASE}/rest/v1/categorias?select=*&order=nombre.asc`,
        {
          headers: {
            apikey: CLAVE,
          },
        }
      );

      if (!respuesta.ok) {
        throw new Error(
          `No se pudieron consultar las categorías: HTTP ${respuesta.status}`
        );
      }

      categorias = (await respuesta.json()) as Categoria[];
    } catch (err) {
      errorCategorias =
        err instanceof Error
          ? err.message
          : 'No se pudieron cargar las categorías.';
    } finally {
      cargandoCategorias = false;
    }
  }

  onMount(() => {
    void cargarCategorias();
  });

  // Crear tutorial mediante una petición POST real
  async function handleSubmit(event: SubmitEvent): Promise<void> {
    event.preventDefault();

    submitted = true;
    mensajeExito = '';
    errorServidor = '';

    // Si los campos son inválidos, NO se envía POST
    if (titulo.trim() === '' || categoria === '' || formato === '') {
      return;
    }

    procesando = true;

    try {
      if (!URL_BASE || !CLAVE) {
        throw new Error('Falta configurar la conexión con Supabase.');
      }

      // Consultar si existe una sesión de Supabase
      const {
        data: { session },
        error: errorSesion,
      } = await supabase.auth.getSession();

      if (errorSesion) {
        throw errorSesion;
      }

      // El ID 1 corresponde al Creador de prueba.
      // Se usa sin sesión solo para demostrar el
      // rechazo del servidor con datos completos.
      let autorId = 1;

      if (session) {
        // Consultar el perfil real del usuario autenticado
        const respuestaPerfil = await fetch(
          `${URL_BASE}/rest/v1/usuarios` +
            `?select=id,rol` +
            `&auth_user_id=eq.${session.user.id}`,
          {
            headers: {
              apikey: CLAVE,
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );

        if (!respuestaPerfil.ok) {
          throw new Error(
            `Error consultando el perfil: HTTP ${respuestaPerfil.status}`
          );
        }

        const perfiles = (await respuestaPerfil.json()) as {
          id: number;
          rol: Rol;
        }[];

        if (perfiles.length === 0) {
          throw new Error(
            'Tu cuenta no tiene un perfil vinculado en TutorHub.'
          );
        }

        if (perfiles[0].rol !== 'Creador') {
          throw new Error(
            'Solamente el rol Creador puede crear tutoriales.'
          );
        }

        // Usar el ID real, no uno fijo
        autorId = perfiles[0].id;
      }

      // Datos que enviaremos a la tabla tutoriales
      const nuevoTutorial: {
        titulo: string;
        descripcion: string | null;
        formato: FormatoTutorial;
        estado: EstadoTutorial;
        autor_id: number;
        categoria_id: number;
      } = {
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || null,
        formato: formato as FormatoTutorial,
        estado: 'borrador',
        autor_id: autorId,
        categoria_id: Number(categoria),
      };

      // Petición POST a Supabase
      const respuesta = await fetch(`${URL_BASE}/rest/v1/tutoriales`, {
        method: 'POST',
        headers: {
          apikey: CLAVE,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
          ...(session
            ? {
                Authorization: `Bearer ${session.access_token}`,
              }
            : {}),
        },
        body: JSON.stringify(nuevoTutorial),
      });

      if (!respuesta.ok) {
        const datosError = (await respuesta
          .json()
          .catch(() => null)) as { message?: string } | null;

        throw new Error(
          traducirRechazoServidor(respuesta.status, datosError?.message)
        );
      }

      // Solo mostrar éxito cuando Supabase confirma el POST
      mensajeExito = `¡Tutorial "${titulo.trim()}" guardado correctamente en borrador!`;

      // Limpiar campos después del éxito
      titulo = '';
      categoria = '';
      formato = '';
      descripcion = '';
      submitted = false;

      // Avisar a App.svelte para actualizar el listado
      onTutorialCreado?.();
    } catch (err) {
      errorServidor =
        err instanceof Error
          ? err.message
          : 'Ocurrió un error al guardar el tutorial.';

      // En caso de error NO limpiamos los campos
    } finally {
      procesando = false;
    }
  }
</script>

<section class="nuevo-tutorial" aria-labelledby="titulo-nuevo">
  <h2 id="titulo-nuevo">Nuevo tutorial</h2>

  <form onsubmit={handleSubmit} novalidate>
    <label for="titulo">Título del tutorial</label>
    <input
      id="titulo"
      name="titulo"
      type="text"
      bind:value={titulo}
      required
      aria-invalid={errorTitulo}
      aria-describedby={errorTitulo ? 'titulo-error' : undefined}
    />

    {#if errorTitulo}
      <p id="titulo-error" class="mensaje-error" role="alert">
        Error: Ingrese el título del tutorial.
      </p>
    {/if}

    <label for="categoria">Categoría</label>
    <select
      id="categoria"
      name="categoria"
      bind:value={categoria}
      required
      aria-invalid={errorCategoria}
      aria-describedby={errorCategoria ? 'categoria-error' : undefined}
    >
      <option value="">Seleccione una categoría</option>

      {#each categorias as item (item.id)}
        <option value={String(item.id)}>
          {item.nombre}
        </option>
      {/each}
    </select>

    {#if cargandoCategorias}
      <p role="status">Cargando categorías...</p>
    {/if}

    {#if errorCategorias}
      <p class="mensaje-error" role="alert">
        {errorCategorias}
      </p>
      <button type="button" onclick={cargarCategorias}>
        Reintentar categorías
      </button>
    {/if}

    {#if errorCategoria}
      <p id="categoria-error" class="mensaje-error" role="alert">
        Error: Seleccione una categoría.
      </p>
    {/if}

    <label for="formato">Formato</label>
    <select
      id="formato"
      name="formato"
      bind:value={formato}
      required
      aria-invalid={errorFormato}
      aria-describedby={errorFormato ? 'formato-error' : undefined}
    >
      <option value="">Seleccione un formato</option>
      <option value="paso-a-paso">Paso a paso</option>
      <option value="video">Video</option>
      <option value="interactivo">Interactivo</option>
    </select>

    {#if errorFormato}
      <p id="formato-error" class="mensaje-error" role="alert">
        Error: Seleccione un formato.
      </p>
    {/if}

    <label for="descripcion">Descripción o resumen</label>
    <input
      id="descripcion"
      name="descripcion"
      type="text"
      bind:value={descripcion}
    />

    <button type="submit" disabled={procesando}>
      {procesando ? 'Guardando...' : 'Crear tutorial'}
    </button>

    {#if errorServidor}
      <p class="mensaje-error" role="alert">
        {errorServidor}
      </p>
    {/if}

    {#if mensajeExito}
      <p class="mensaje-exito" role="status">
        {mensajeExito}
      </p>
    {/if}
  </form>
</section>
