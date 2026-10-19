<script lang="ts">
  import Formulario from './Formulario.svelte';
</script>

<header>
  <p>TutorHub</p>
  <nav aria-label="Principal">
    <a href="/tutoriales">Tutoriales</a>
    <a href="/categorias">Categorías</a>
  </nav>
</header>

<main>
  <h1>Mis tutoriales y su estado</h1>
  <table>
    <caption>Listado de tutoriales creados</caption>

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
      <tr>
        <td>Cómo instalar Visual Studio Code</td>
        <td>Programación</td>
        <td>Paso a paso</td>
        <td>Borrador</td>
        <td><a href="/tutoriales/1">Ver</a></td>
      </tr>

      <tr>
        <td>Diseño básico con Figma</td>
        <td>Diseño</td>
        <td>Video</td>
        <td>En revisión</td>
        <td><a href="/tutoriales/2">Ver</a></td>
      </tr>

      <tr>
        <td>Crear una base de datos en Supabase</td>
        <td>Bases de datos</td>
        <td>Paso a paso</td>
        <td>Publicado</td>
        <td><a href="/tutoriales/3">Ver</a></td>
      </tr>
    </tbody>
  </table>
  <Formulario />
</main>