// Versión del profesor de "Pendientes de Calificaciones": mismo concepto que
// la pantalla del admin (bridge-admin-web), pero acotada de entrada a lo que
// a ESTE profesor le falta capturar — sin selector de profesor, sin
// exportar/gráficas (el admin las necesita para un reporte general; aquí es
// solo un atajo personal para saber a quién le falta calificar y capturarlo
// de una vez). Se llega aquí desde el ícono de pendientes del Navbar.
import React, { useEffect, useMemo, useState } from "react";
import Navbar from "../../components/Navbar";
import { supabase } from "../../supabaseClient";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faMagnifyingGlass,
  faUserGraduate,
  faBook,
  faChevronRight,
  faCircleCheck,
} from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import { calcularPendientesDocente } from "../../utils/pendientes";

export default function PendientesCalificaciones() {
  const navigate = useNavigate();

  const [asignaciones, setAsignaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    cargar();
  }, []);

  const cargar = async () => {
    setLoading(true);

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      navigate("/");
      return;
    }

    // Si el admin apagó la captura de calificaciones, esta pantalla no tiene
    // nada útil que mostrar (ni el docente puede guardar nada todavía) — se
    // regresa al Dashboard en vez de dejarlo ver una lista de huecos que no
    // puede llenar. Mismo switch que ya usan Calificar Universidad/Bachillerato.
    const { data: config } = await supabase
      .from("configuracion_sistema")
      .select("captura_calificaciones_habilitada")
      .eq("id", 1)
      .single();

    if (!config?.captura_calificaciones_habilitada) {
      navigate("/Dashboard");
      return;
    }

    const datos = await calcularPendientesDocente(userData.user.id);
    setAsignaciones(datos);
    setLoading(false);
  };

  const filtradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return asignaciones;
    return asignaciones.filter((a) => {
      if (a.materia.toLowerCase().includes(termino) || a.grupoNombre.toLowerCase().includes(termino)) return true;
      return a.alumnos.some(
        (al) => al.nombre.toLowerCase().includes(termino) || al.correo.toLowerCase().includes(termino)
      );
    });
  }, [asignaciones, busqueda]);

  const totalAlumnos = useMemo(() => asignaciones.reduce((acc, a) => acc + a.alumnos.length, 0), [asignaciones]);

  // Mismo contrato de navegación que ya usan las tarjetas de "Mis Grupos" en
  // el Dashboard: la pantalla de Calificar recibe la materia por location.state
  // y valida por su cuenta que el grupo sí sea de este profesor.
  const irACapturar = (asig) => {
    const ruta =
      asig.tipo === "bachillerato" ? "Bachillerato" : asig.tipo === "secundaria" ? "Secundaria" : "Universidad";
    navigate(`/Calificar/${ruta}/${asig.id_grupo}`, { state: { materia: asig.materia } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar titulo="Pendientes de Calificaciones" />

      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-5xl mx-auto">
        <button
          onClick={() => navigate("/Dashboard")}
          className="inline-flex items-center gap-2 bg-white text-purple-700 font-semibold px-5 py-2.5 rounded-xl shadow-sm hover:bg-purple-50 border border-purple-200 transition-all duration-200 w-fit mb-6"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          <span>Regresar</span>
        </button>

        <div className="bg-white rounded-2xl shadow-md p-6 mb-6 border border-gray-100">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Pendientes de Calificaciones</h1>
          <p className="text-gray-500 mt-1">
            Tus alumnos sin calificación capturada, agrupados por materia y grupo. Toca una tarjeta para ir directo a
            capturarles la nota.
          </p>
        </div>

        {!loading && asignaciones.length > 0 && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-2xl shadow-md p-5 border border-gray-100 text-center">
              <p className="text-3xl font-bold text-purple-800">{asignaciones.length}</p>
              <p className="text-sm text-gray-500 mt-1">materia{asignaciones.length === 1 ? "" : "s"} con huecos</p>
            </div>
            <div className="bg-white rounded-2xl shadow-md p-5 border border-gray-100 text-center">
              <p className="text-3xl font-bold text-red-600">{totalAlumnos}</p>
              <p className="text-sm text-gray-500 mt-1">alumno{totalAlumnos === 1 ? "" : "s"} sin calificación</p>
            </div>
          </div>
        )}

        {!loading && asignaciones.length > 0 && (
          <div className="relative mb-6">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar alumno, materia o grupo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-purple-400 focus:border-transparent"
            />
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-60">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : asignaciones.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md border border-dashed border-gray-200 p-10 text-center">
            <FontAwesomeIcon icon={faCircleCheck} className="text-4xl text-green-500 mb-3" />
            <p className="text-green-700 font-semibold">¡Estás al día!</p>
            <p className="text-gray-500 text-sm mt-1">No tienes ningún alumno pendiente de calificación.</p>
          </div>
        ) : filtradas.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md border border-dashed border-gray-200 p-10 text-center text-gray-500">
            Ningún resultado coincide con tu búsqueda.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtradas.map((asig) => (
              <button
                key={asig.clave}
                onClick={() => irACapturar(asig)}
                className="group text-left bg-white rounded-2xl shadow-md hover:shadow-xl border border-gray-100 hover:border-purple-300 transition-all duration-200 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FontAwesomeIcon icon={faBook} className="text-purple-500 flex-shrink-0" />
                      <p className="font-semibold text-gray-800 text-lg truncate">{asig.materia}</p>
                    </div>
                    <p className="text-sm text-gray-500">
                      {asig.grupoNombre} · {asig.carreraNombre || "Sin carrera"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="inline-flex items-center justify-center min-w-9 h-9 px-2.5 rounded-full bg-red-100 text-red-700 font-bold text-sm">
                      {asig.alumnos.length}
                    </span>
                    <FontAwesomeIcon
                      icon={faChevronRight}
                      className="text-gray-300 group-hover:text-purple-500 transition"
                    />
                  </div>
                </div>

                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-4">
                  {asig.alumnos.slice(0, 6).map((al) => (
                    <li
                      key={al.correo}
                      className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-1.5"
                    >
                      <FontAwesomeIcon icon={faUserGraduate} className="text-gray-400 text-xs flex-shrink-0" />
                      <span className="truncate">{al.nombre}</span>
                    </li>
                  ))}
                  {asig.alumnos.length > 6 && (
                    <li className="flex items-center text-sm text-purple-600 font-medium px-3 py-1.5">
                      + {asig.alumnos.length - 6} más…
                    </li>
                  )}
                </ul>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
