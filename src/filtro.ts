
import { ESTADOS_TUTORIAL } from './estado';
import type { EstadoTutorial } from './tipos';

export type FiltroTutorial = EstadoTutorial | 'todos';

const CLAVE_FILTRO = 'tutorhub.filtro.estado';

// Recuperar y validar el filtro guardado.
export function leerFiltro(): FiltroTutorial {
  const guardado = localStorage.getItem(CLAVE_FILTRO);

  if (
    guardado === 'todos' ||
    ESTADOS_TUTORIAL.includes(guardado as EstadoTutorial)
  ) {
    return guardado as FiltroTutorial;
  }

  return 'todos';
}

// Guardar la preferencia del usuario.
export function guardarFiltro(filtro: FiltroTutorial): void {
  localStorage.setItem(CLAVE_FILTRO, filtro);
}
