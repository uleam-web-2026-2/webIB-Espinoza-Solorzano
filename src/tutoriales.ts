
import { supabase } from './supabase';
import type { EstadoTutorial, Tutorial } from './tipos';

const URL_BASE = import.meta.env.VITE_SUPABASE_URL;
const CLAVE_PUBLICA = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Resultado que devuelve Supabase al intentar cambiar el estado.
export interface ResultadoCambioTutorial {
  codigo: number;
  filas: Tutorial[];
  detalleError: string | null;
}

// Actualizar el estado de un tutorial en Supabase.
export async function cambiarEstadoTutorial(
  id: number,
  estadoActual: EstadoTutorial,
  nuevoEstado: EstadoTutorial
): Promise<ResultadoCambioTutorial> {
  if (!URL_BASE || !CLAVE_PUBLICA) {
    throw new Error('Falta configurar la conexión con Supabase.');
  }

  // Obtener la sesión actual para enviar el token.
  const {
    data: { session },
    error: errorSesion,
  } = await supabase.auth.getSession();

  if (errorSesion) {
    throw new Error('No se pudo comprobar la sesión.');
  }

  const encabezados: Record<string, string> = {
    apikey: CLAVE_PUBLICA,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };

  if (session) {
    encabezados.Authorization = `Bearer ${session.access_token}`;
  }

  // Comprobar que el tutorial siga en el estado esperado.
  const url =
    `${URL_BASE}/rest/v1/tutoriales` +
    `?id=eq.${id}` +
    `&estado=eq.${estadoActual}` +
    `&select=*`;

  const respuesta = await fetch(url, {
    method: 'PATCH',
    headers: encabezados,
    body: JSON.stringify({
      estado: nuevoEstado,
    }),
  });

  // Si Supabase rechaza la petición, conservar el error.
  if (!respuesta.ok) {
    const detalle = (await respuesta.json().catch(() => null)) as {
      message?: string;
    } | null;

    return {
      codigo: respuesta.status,
      filas: [],
      detalleError: detalle?.message ?? null,
    };
  }

  // Supabase devuelve las filas realmente modificadas.
  const filas = (await respuesta.json()) as Tutorial[];

  return {
    codigo: respuesta.status,
    filas,
    detalleError: null,
  };
}
