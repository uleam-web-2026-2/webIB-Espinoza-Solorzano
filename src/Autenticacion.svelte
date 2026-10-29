<script lang="ts">
  import { onMount } from 'svelte';
  import type { Session } from '@supabase/supabase-js';
  import { supabase } from './supabase';

  let correo = $state('creador.tutorhub@example.com');
  let contrasena = $state('');

  let sesion = $state<Session | null>(null);
  let cargando = $state(true);
  let procesando = $state(false);
  let error = $state('');

  function traducirErrorAuth(mensaje: string): string {
    if (mensaje === 'Invalid login credentials') {
      return 'Correo o contraseña incorrectos.';
    }

    if (mensaje === 'Email not confirmed') {
      return 'El correo electrónico no está confirmado.';
    }

    if (mensaje.toLowerCase().includes('failed to fetch')) {
      return 'Sin conexión con el servidor. Verifique su red e inténtelo nuevamente.';
    }

    return 'No se pudo completar la autenticación. Inténtelo nuevamente.';
  }

  // Comprobar la sesión al abrir la página
  onMount(() => {
    let activo = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_evento, nuevaSesion) => {
      if (!activo) return;

      sesion = nuevaSesion;
      cargando = false;
    });

    void supabase.auth.getSession().then(({ data, error: errorSesion }) => {
      if (!activo) return;

      sesion = data.session;

      if (errorSesion) {
        error = traducirErrorAuth(errorSesion.message);
      }

      cargando = false;
    });

    return () => {
      activo = false;
      subscription.unsubscribe();
    };
  });

  // Iniciar sesión
  async function iniciarSesion(event: SubmitEvent): Promise<void> {
    event.preventDefault();

    if (!correo.trim() || !contrasena) {
      error = 'Ingrese el correo electrónico y la contraseña.';
      return;
    }

    procesando = true;
    error = '';

    try {
      const { error: errorAuth } = await supabase.auth.signInWithPassword({
        email: correo.trim(),
        password: contrasena,
      });

      if (errorAuth) {
        throw errorAuth;
      }

      contrasena = '';
    } catch (err) {
      error =
        err instanceof Error
          ? traducirErrorAuth(err.message)
          : 'No se pudo iniciar sesión.';
    } finally {
      procesando = false;
    }
  }

  // Cerrar la sesión actual
  async function cerrarSesion(): Promise<void> {
    procesando = true;
    error = '';

    try {
      const { error: errorAuth } = await supabase.auth.signOut({
        scope: 'local',
      });

      if (errorAuth) {
        throw errorAuth;
      }
    } catch (err) {
      error =
        err instanceof Error
          ? traducirErrorAuth(err.message)
          : 'No se pudo cerrar la sesión.';
    } finally {
      procesando = false;
    }
  }
</script>

<section class="seccion-acceso" aria-labelledby="titulo-auth">
  <h2 id="titulo-auth">Acceso a TutorHub</h2>

  {#if cargando}
    <p role="status">Comprobando sesión...</p>
  {:else if sesion}
    <p role="status">
      Sesión iniciada: {sesion.user.email}
    </p>

    <button
      type="button"
      onclick={cerrarSesion}
      disabled={procesando}
    >
      Cerrar sesión
    </button>
  {:else}
    <form onsubmit={iniciarSesion}>
      <label for="correo-auth">Correo electrónico</label>
      <input
        id="correo-auth"
        name="correo"
        type="email"
        bind:value={correo}
        autocomplete="username"
        required
      />

      <label for="contrasena-auth">Contraseña</label>
      <input
        id="contrasena-auth"
        name="contrasena"
        type="password"
        bind:value={contrasena}
        autocomplete="current-password"
        required
      />

      <button type="submit" disabled={procesando}>
        {procesando ? 'Ingresando...' : 'Iniciar sesión'}
      </button>
    </form>
  {/if}

  {#if error}
    <p role="alert" class="mensaje-error">
      {error}
    </p>
  {/if}
</section>

