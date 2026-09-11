import { supabase } from "../supabaseClient";

// Misma lógica de "pendiente" que usa el admin en Pendientes de Calificaciones
// (bridge-admin-web), pero acotada de entrada a las asignaciones de UN solo
// profesor (con `.eq`/`.in` en vez de traer todo el sistema): un alumno
// inscrito en un grupo (grupo_alumnos) cuya materia tiene a este profesor
// asignado (grupo_profesores), pero sin ninguna fila en `calificaciones`
// (universidad/autoplaneado) ni `calificaciones_parciales` (bachillerato)
// para ese (id_grupo, materia, id_alumno). Se comparte entre el Navbar (solo
// necesita el conteo, para el badge de la campanita de pendientes) y la
// pantalla completa de Pendientes, para no mantener la misma consulta en 2
// lugares.
//
// Nota: igual que en el admin, no se distingue por `parcial` en bachillerato
// — si existe cualquier parcial capturado para esa materia/alumno, ya no
// cuenta como pendiente. Hoy no hay grupos de bachillerato activos, así que
// esta simplificación no tiene efecto real todavía.
export async function calcularPendientesDocente(userId) {
  const { data: asignaciones, error: errorAsignaciones } = await supabase
    .from("vista_profesor_grupos")
    .select("id_grupo, grupo_nombre, carrera_nombre, materia, tipo")
    .eq("id_profesor", userId);

  if (errorAsignaciones || !asignaciones || asignaciones.length === 0) return [];

  const idsGrupos = [...new Set(asignaciones.map((a) => a.id_grupo))];

  const [{ data: inscripciones }, { data: calificaciones }, { data: parciales }] = await Promise.all([
    supabase
      .from("grupo_alumnos")
      .select("id_grupo, id_alumno, alumnos(nombre, apellido_paterno, apellido_materno, correo)")
      .in("id_grupo", idsGrupos),
    supabase.from("calificaciones").select("id_grupo, materia, id_alumno").in("id_grupo", idsGrupos),
    supabase.from("calificaciones_parciales").select("id_grupo, materia, id_alumno").in("id_grupo", idsGrupos),
  ]);

  const capturado = new Set();
  [...(calificaciones || []), ...(parciales || [])].forEach((c) => {
    if (c.id_grupo == null) return;
    capturado.add(`${c.id_grupo}|${c.materia}|${c.id_alumno}`);
  });

  const alumnosPorGrupo = new Map();
  (inscripciones || []).forEach((i) => {
    if (!i.alumnos) return;
    const lista = alumnosPorGrupo.get(i.id_grupo) || [];
    lista.push({ id_alumno: i.id_alumno, ...i.alumnos });
    alumnosPorGrupo.set(i.id_grupo, lista);
  });

  const porAsignacion = new Map();
  asignaciones.forEach((a) => {
    if (!a.materia) return;
    const clave = `${a.id_grupo}|${a.materia}`;
    if (!porAsignacion.has(clave)) {
      porAsignacion.set(clave, {
        clave,
        id_grupo: a.id_grupo,
        materia: a.materia,
        grupoNombre: a.grupo_nombre,
        carreraNombre: a.carrera_nombre,
        tipo: a.tipo,
        alumnos: [],
      });
    }
  });

  porAsignacion.forEach((asig) => {
    // Mismo orden que "Pase de Lista" y "Calificar": apellido paterno,
    // materno y nombre (no el orden en que llegaron de grupo_alumnos).
    const alumnosDelGrupo = [...(alumnosPorGrupo.get(asig.id_grupo) || [])].sort((a, b) =>
      `${a.apellido_paterno || ""} ${a.apellido_materno || ""} ${a.nombre || ""}`.localeCompare(
        `${b.apellido_paterno || ""} ${b.apellido_materno || ""} ${b.nombre || ""}`,
        "es"
      )
    );
    alumnosDelGrupo.forEach((alumno) => {
      const clave = `${asig.id_grupo}|${asig.materia}|${alumno.id_alumno}`;
      if (capturado.has(clave)) return;
      asig.alumnos.push({
        nombre: `${alumno.nombre} ${alumno.apellido_paterno} ${alumno.apellido_materno || ""}`.trim(),
        correo: alumno.correo,
      });
    });
  });

  return [...porAsignacion.values()]
    .filter((a) => a.alumnos.length > 0)
    .sort((a, b) => a.materia.localeCompare(b.materia, "es"));
}
