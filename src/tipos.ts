/*
 * TutorHub — Hito 2
 * Contrato de datos de las cinco entidades del modelo (Hito 1).
 * Cada propiedad coincide exactamente con el nombre de columna en Supabase.
 */

// Uniones literales de estados y valores permitidos
export type EstadoTutorial = 'borrador' | 'en_revision' | 'publicado';
export type FormatoTutorial = 'paso-a-paso' | 'video' | 'interactivo';
export type Rol = 'Creador' | 'Revisor';
export type ResultadoRevision = 'Aprobado' | 'Devuelto';

// 1. Tabla principal: tutoriales (entidad con máquina de estados)
export interface Tutorial {
  id: number;
  titulo: string;
  descripcion: string | null;
  formato: FormatoTutorial;
  estado: EstadoTutorial;
  fecha_creacion: string;
  fecha_actualizacion: string | null;
  autor_id: number; // Relación N:1 -> usuarios.id
  categoria_id: number; // Relación N:1 -> categorias.id
}

// 2. Tabla relacionada en el detalle: pasos_tutorial
export interface PasoTutorial {
  id: number;
  orden: number;
  instruccion: string;
  captura_url: string;
  posicion_x: number;
  posicion_y: number;
  elemento_html: string | null;
  texto_elemento: string | null;
  pagina_url: string | null;
  tutorial_id: number; // Relación N:1 -> tutoriales.id
}

// 3. Tabla: usuarios
export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  rol: Rol;
  fecha_creacion: string;
  auth_user_id: string | null; // Enlace opcional con auth.users de Supabase
}

// 4. Tabla: categorias
export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string | null;
}

// 5. Tabla: revisiones
export interface Revision {
  id: number;
  observaciones: string | null;
  resultado: ResultadoRevision;
  fecha_revision: string;
  tutorial_id: number; // Relación N:1 -> tutoriales.id
  revisor_id: number; // Relación N:1 -> usuarios.id
}

// Proyecciones de lectura con relaciones de PostgREST.
// No representan tablas adicionales en Supabase.
export interface TutorialConCategoria extends Tutorial {
  categorias: {
    nombre: string;
  } | null;
}

export interface TutorialConPasos extends Tutorial {
  pasos_tutorial: PasoTutorial[];
}

