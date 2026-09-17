import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRightFromBracket,
  faSpinner,
  faLayerGroup,
  faUserGraduate,
  faChalkboardTeacher,
  faBookOpen,
  faClipboardCheck,
  faMagnifyingGlass,
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import Avatar from "../../components/Avatar.jsx";
import { PERIODO_ACTUAL } from "../../utils/periodoActual";

export default function Dashboard() {
  const [profesor, setProfesor] = useState(null);
  const [correo, setCorreo] = useState("");
  const [grupos, setGrupos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [busquedaMateria, setBusquedaMateria] = useState("");
  // Por defecto el docente entra viendo el periodo vigente.
  const [filtroPeriodo, setFiltroPeriodo] = useState(`${PERIODO_ACTUAL.periodo}-${PERIODO_ACTUAL.anio}`);

  useEffect(() => {
    const init = async () => {
      await fetchUserData();
      setCargando(false);
    };
    init();
  }, []);

  const fetchUserData = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) {
      window.location.href = "/";
      return;
    }

    const userId = data.user.id;
    setCorreo(data.user.email);

    const { data: perfil, error: perfilError } = await supabase
      .from("profesores")
      .select("nombre, apellido_paterno, apellido_materno, foto_url")
      .eq("id", userId)
      .single();

    if (!perfilError && perfil) setProfesor(perfil);

    await fetchGrupos(userId);
  };

  // Grupos asignados a este profesor, con el total de alumnos de cada uno
  const fetchGrupos = async (userId) => {
    const { data: gruposData, error: gruposError } = await supabase
      .from("vista_profesor_grupos")
      .select("*")
      .eq("id_profesor", userId);

    if (gruposError || !gruposData) {
      console.error("Error al cargar grupos:", gruposError);
      return;
    }

    const idsGrupos = gruposData.map((g) => g.id_grupo);
    let conteos = {};

    if (idsGrupos.length > 0) {
      const { data: alumnosData } = await supabase
        .from("grupo_alumnos")
        .select("id_grupo")
        .in("id_grupo", idsGrupos);

      conteos = (alumnosData || []).reduce((acc, fila) => {
        acc[fila.id_grupo] = (acc[fila.id_grupo] || 0) + 1;
        return acc;
      }, {});
    }

    setGrupos(
      gruposData.map((g) => ({ ...g, total_alumnos: conteos[g.id_grupo] || 0 }))
    );
  };

  const handleLogOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  // Filtros rápidos de "Mis Grupos" por tipo (universidad / bachillerato / autoplaneado).
  // Mismos colores que ya usaban las etiquetas de cada tarjeta de grupo:
  // universidad=azul, bachillerato=rojo, autoplaneado=verde (ver badge más abajo).
  const FILTROS_TIPO = [
    {
      valor: "todos",
      etiqueta: "Todos",
      activo: "bg-purple-700 text-white border-purple-700",
      inactivo: "bg-white text-purple-700 border-purple-200 hover:bg-purple-50",
    },
    {
      valor: "universidad",
      etiqueta: "Universidad",
      activo: "bg-blue-700 text-white border-blue-700",
      inactivo: "bg-white text-blue-700 border-blue-200 hover:bg-blue-50",
    },
    {
      valor: "bachillerato",
      etiqueta: "Bachillerato",
      activo: "bg-red-700 text-white border-red-700",
      inactivo: "bg-white text-red-700 border-red-200 hover:bg-red-50",
    },
    {
      valor: "autoplaneado",
      etiqueta: "Autoplaneado",
      activo: "bg-green-700 text-white border-green-700",
      inactivo: "bg-white text-green-700 border-green-200 hover:bg-green-50",
    },
    {
      valor: "secundaria",
      etiqueta: "Secundaria",
      activo: "bg-teal-700 text-white border-teal-700",
      inactivo: "bg-white text-teal-700 border-teal-200 hover:bg-teal-50",
    },
  ];

  // Pestañas de periodo (ciclo cuatrimestral). Bachillerato no maneja
  // periodo (solo semestre/año, ver CrearGrupo.jsx), así que esos grupos
  // llegan con periodo=null y deben verse en ambas pestañas en vez de
  // desaparecer.
  const FILTROS_PERIODO = [
    { valor: "MAY-AGO-2026", periodo: "MAY-AGO", anio: 2026, etiqueta: "MAY-AGO 2026" },
    {
      valor: `${PERIODO_ACTUAL.periodo}-${PERIODO_ACTUAL.anio}`,
      periodo: PERIODO_ACTUAL.periodo,
      anio: PERIODO_ACTUAL.anio,
      etiqueta: `${PERIODO_ACTUAL.periodo} ${PERIODO_ACTUAL.anio}`,
    },
  ];
  const periodoSeleccionado = FILTROS_PERIODO.find((p) => p.valor === filtroPeriodo);

  // El buscador filtra solo por materia (no por nombre de grupo), y aplica
  // igual sin importar la escolaridad — se combina con el filtro de tipo de
  // arriba, pero busca sobre universidad, bachillerato y autoplaneado por igual.
  const gruposFiltrados = grupos
    .filter(
      (g) =>
        !g.periodo ||
        (g.periodo === periodoSeleccionado.periodo && g.anio === periodoSeleccionado.anio)
    )
    .filter((g) => filtroTipo === "todos" || g.tipo === filtroTipo)
    .filter((g) => {
      const termino = busquedaMateria.trim().toLowerCase();
      if (!termino) return true;
      return (g.materia || "").toLowerCase().includes(termino);
    });

  const nombreCompleto = profesor
    ? `${profesor.nombre} ${profesor.apellido_paterno} ${profesor.apellido_materno || ""}`
    : "";

  if (cargando) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-100 flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon icon={faSpinner} spin size="3x" className="text-purple-600 mb-4" />
          <p className="text-gray-600">Cargando tu espacio de trabajo...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50">
      <Navbar titulo="Instituto Tecnológico Bridge" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Panel de bienvenida */}
        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 overflow-hidden mb-10">
          <div className="bg-gradient-to-r from-purple-800 to-purple-600 px-6 py-4">
            <h2 className="text-white text-xl font-semibold flex items-center gap-2">
              <span>👋</span> Panel de Bienvenida
            </h2>
          </div>
          <div className="p-6 flex flex-col items-center text-center gap-4 sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4 min-w-0">
              <Avatar
                fotoUrl={profesor?.foto_url}
                nombre={profesor?.nombre}
                apellidoPaterno={profesor?.apellido_paterno}
                apellidoMaterno={profesor?.apellido_materno}
                size={56}
              />
              <div className="min-w-0">
                <p className="text-gray-800 text-xl sm:text-2xl font-bold break-words">{nombreCompleto || "Profesor(a)"}</p>
                <p className="text-gray-500 mt-1 flex items-center justify-center gap-1 sm:justify-start flex-wrap break-all">
                  <span className="text-sm">📧</span> {correo}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogOut}
              className="flex items-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 px-5 py-2.5 rounded-xl transition-all duration-200 font-medium shadow-sm hover:shadow"
            >
              <FontAwesomeIcon icon={faArrowRightFromBracket} />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>

        {/* Mis grupos */}
        <div className="mb-12">
          <h3 className="text-2xl font-bold text-purple-900 mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faLayerGroup} className="text-purple-600" />
            Mis Grupos
          </h3>

          {grupos.length > 0 && (
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="flex flex-wrap gap-2 pr-3 border-r border-purple-100">
                {FILTROS_PERIODO.map((periodo) => (
                  <button
                    key={periodo.valor}
                    onClick={() => setFiltroPeriodo(periodo.valor)}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition ${
                      filtroPeriodo === periodo.valor
                        ? "bg-indigo-700 text-white border-indigo-700"
                        : "bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                    }`}
                  >
                    {periodo.etiqueta}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {FILTROS_TIPO.map((filtro) => (
                  <button
                    key={filtro.valor}
                    onClick={() => setFiltroTipo(filtro.valor)}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition ${
                      filtroTipo === filtro.valor ? filtro.activo : filtro.inactivo
                    }`}
                  >
                    {filtro.etiqueta}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-56">
                <FontAwesomeIcon
                  icon={faMagnifyingGlass}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
                />
                <input
                  type="text"
                  value={busquedaMateria}
                  onChange={(e) => setBusquedaMateria(e.target.value)}
                  placeholder="Buscar materia..."
                  className="w-full rounded-full border border-purple-200 bg-white py-1.5 pl-9 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
              </div>
            </div>
          )}

          {grupos.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-md border border-dashed border-purple-200 p-10 text-center text-gray-500">
              Aún no tienes grupos asignados. Contacta al administrador si crees que esto es un error.
            </div>
          ) : gruposFiltrados.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-md border border-dashed border-purple-200 p-10 text-center text-gray-500">
              {busquedaMateria.trim()
                ? "No encontramos ninguna materia que coincida con tu búsqueda."
                : `No tienes grupos de este tipo en el periodo ${periodoSeleccionado.etiqueta}.`}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {gruposFiltrados.map((grupo) => (
                <div
                  key={`${grupo.id_grupo}-${grupo.materia}`}
                  className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-purple-100 hover:border-purple-300 flex flex-col items-center text-center"
                >
                  <div className="bg-purple-100 rounded-full p-4 mb-4 group-hover:bg-purple-200 transition">
                    <FontAwesomeIcon icon={faChalkboardTeacher} className="text-4xl text-purple-700" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-1">{grupo.grupo_nombre}</h4>
                  {grupo.materia && (
                    <p className="text-purple-700 text-base font-bold flex items-center gap-1.5 mb-2">
                      <FontAwesomeIcon icon={faBookOpen} className="text-purple-400" />
                      {grupo.materia}
                    </p>
                  )}
                  <span
                    className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-1 ${
                      grupo.tipo === "bachillerato"
                        ? "bg-red-100 text-red-700"
                        : grupo.tipo === "autoplaneado"
                        ? "bg-green-100 text-green-700"
                        : grupo.tipo === "secundaria"
                        ? "bg-teal-100 text-teal-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {grupo.tipo === "bachillerato"
                      ? "Bachillerato"
                      : grupo.tipo === "autoplaneado"
                      ? "Autoplaneado"
                      : grupo.tipo === "secundaria"
                      ? "Secundaria"
                      : "Universidad"}
                  </span>
                  <p className="text-gray-600 text-sm font-medium mb-1">
                    {grupo.carrera_nombre || "Sin carrera asignada"}
                  </p>
                  {(grupo.tipo === "bachillerato" || grupo.tipo === "secundaria") &&
                    grupo.semestre && (
                      <p className="text-gray-400 text-xs mb-2">
                        {grupo.tipo === "secundaria" ? "Grado" : "Semestre"} {grupo.semestre}
                      </p>
                    )}
                  {grupo.tipo === "universidad" &&
                    grupo.cuatrimestre && <p className="text-gray-400 text-xs mb-2">Cuatrimestre {grupo.cuatrimestre}</p>}
                  <p className="text-gray-500 text-sm flex items-center gap-1.5 mt-2 mb-4">
                    <FontAwesomeIcon icon={faUserGraduate} />
                    {grupo.total_alumnos} alumno{grupo.total_alumnos === 1 ? "" : "s"}
                  </p>
                  <div className="flex gap-2 w-full">
                    <Link
                      to={`/Asistencia/${grupo.id_grupo}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-sm font-semibold px-3 py-2 rounded-xl transition"
                    >
                      <FontAwesomeIcon icon={faClipboardCheck} />
                      Asistencia
                    </Link>
                    <Link
                      to={
                        grupo.tipo === "bachillerato"
                          ? `/Calificar/Bachillerato/${grupo.id_grupo}`
                          : grupo.tipo === "secundaria"
                          ? `/Calificar/Secundaria/${grupo.id_grupo}`
                          : `/Calificar/Universidad/${grupo.id_grupo}`
                      }
                      state={{ materia: grupo.materia }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 bg-purple-700 hover:bg-purple-800 text-white text-sm font-semibold px-3 py-2 rounded-xl transition"
                    >
                      Calificar
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
