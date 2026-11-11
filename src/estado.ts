
import type { EstadoTutorial, Rol } from './tipos';

// Estados permitidos de los tutoriales.
export const ESTADOS_TUTORIAL: EstadoTutorial[] = [
  'borrador',
  'en_revision',
  'publicado',
];

// Traduce los estados para mostrarlos en pantalla.
export function nombreEstado(
  estado: EstadoTutorial
): string {
  if (estado === 'borrador') {
    return 'Borrador';
  }

  if (estado === 'en_revision') {
    return 'En revisión';
  }

  return 'Publicado';
}

// Máquina de estados de TutorHub.
// Comprueba el rol y la transición solicitada.
export function puedeCambiar(
  actual: EstadoTutorial,
  nuevo: EstadoTutorial,
  rol: Rol
): boolean {
  // El Creador envía un borrador a revisión.
  if (
    rol === 'Creador' &&
    actual === 'borrador' &&
    nuevo === 'en_revision'
  ) {
    return true;
  }

  // El Revisor aprueba un tutorial.
  if (
    rol === 'Revisor' &&
    actual === 'en_revision' &&
    nuevo === 'publicado'
  ) {
    return true;
  }

  // El Revisor devuelve un tutorial.
  if (
    rol === 'Revisor' &&
    actual === 'en_revision' &&
    nuevo === 'borrador'
  ) {
    return true;
  }

  // Todas las demás transiciones están prohibidas.
  return false;
}
