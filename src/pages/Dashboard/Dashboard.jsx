import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRightFromBracket,
  faBell,
  faSpinner,
  faLayerGroup,
  faUserGraduate,
  faChalkboardTeacher,
  faBookOpen,
  faClipboardCheck,
} from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import Swal from "sweetalert2";
import Avatar from "../../components/Avatar.jsx";

export default function Dashboard() {
  const [profesor, setProfesor] = useState(null);
  const [correo, setCorreo] = useState("");
  const [grupos, setGrupos] = useState([]);
  const [avisos, setAvisos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const init = async () => {
      await fetchUserData();
      await fetchAvisos();
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

  const fetchAvisos = async () => {
    const { data, error } = await supabase
      .from("avisos")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setAvisos(data || []);
  };

  const mostrarAviso = (aviso) => {
    const fecha = aviso.created_at ? new Date(aviso.created_at).toLocaleString("es-MX") : "Fecha no disponible";

    Swal.fire({
      title: aviso.titulo,
      html: `
        <div style="text-align:left;">
          <p>${aviso.descripcion}</p>
          <p style="margin-top:12px; font-size:0.85rem; color:#6b7280;"><strong>Publicado:</strong> ${fecha}</p>
        </div>
      `,
      icon: "info",
      confirmButtonText: "Entendido",
      confirmButtonColor: "#7c3aed",
    });
  };

  const handleLogOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

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
          <div className="bg-gradient-to-r from-orange-600 to-orange-400 px-6 py-4">
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
          <h3 className="text-2xl font-bold text-purple-900 mb-6 flex items-center gap-2">
            <FontAwesomeIcon icon={faLayerGroup} className="text-purple-600" />
            Mis Grupos
          </h3>

          {grupos.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-md border border-dashed border-purple-200 p-10 text-center text-gray-500">
              Aún no tienes grupos asignados. Contacta al administrador si crees que esto es un error.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {grupos.map((grupo) => (
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
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {grupo.tipo === "bachillerato"
                      ? "Bachillerato"
                      : grupo.tipo === "autoplaneado"
                      ? "Autoplaneado"
                      : "Universidad"}
                  </span>
                  <p className="text-gray-600 text-sm font-medium mb-1">
                    {grupo.carrera_nombre || "Sin carrera asignada"}
                  </p>
                  {grupo.tipo === "bachillerato" &&
                    grupo.semestre && <p className="text-gray-400 text-xs mb-2">Semestre {grupo.semestre}</p>}
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

        {/* Avisos */}
        <div>
          <h3 className="text-2xl font-bold text-purple-900 mb-6 flex items-center gap-2">
            <FontAwesomeIcon icon={faBell} className="text-purple-600" />
            Avisos importantes
          </h3>
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6">
              {avisos.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No hay avisos disponibles en este momento.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {avisos.map((aviso) => (
                    <div
                      key={aviso.id_aviso}
                      onClick={() => mostrarAviso(aviso)}
                      className="bg-white border border-purple-200 rounded-xl p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:border-purple-400 hover:bg-purple-50/30"
                    >
                      <h4 className="font-bold text-purple-800 text-base line-clamp-1">{aviso.titulo}</h4>
                      <p className="text-gray-600 text-sm mt-2 line-clamp-3">{aviso.descripcion}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
