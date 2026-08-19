import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { supabase } from "../../supabaseClient";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faUserGraduate, faSearch } from "@fortawesome/free-solid-svg-icons";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

export default function MiGrupo() {
  const { id_grupo } = useParams();
  const navigate = useNavigate();

  const [grupo, setGrupo] = useState(null);
  const [alumnos, setAlumnos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [autorizado, setAutorizado] = useState(false);

  useEffect(() => {
    verificarAccesoYCargar();
  }, [id_grupo]);

  const verificarAccesoYCargar = async () => {
    setLoading(true);

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      navigate("/");
      return;
    }

    // Verificar que este profesor sí tenga asignado este grupo
    const { data: asignacion, error: asignacionError } = await supabase
      .from("grupo_profesores")
      .select("id")
      .eq("id_grupo", id_grupo)
      .eq("id_profesor", userData.user.id)
      .limit(1);

    if (asignacionError || !asignacion || asignacion.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Sin acceso",
        text: "Este grupo no está asignado a tu cuenta.",
        confirmButtonColor: "#7c3aed",
      }).then(() => navigate("/Dashboard"));
      return;
    }

    setAutorizado(true);
    await Promise.all([fetchGrupo(), fetchAlumnos()]);
    setLoading(false);
  };

  const fetchGrupo = async () => {
    const { data, error } = await supabase
      .from("vista_grupos_resumen")
      .select("*")
      .eq("id_grupo", id_grupo)
      .single();

    if (!error) setGrupo(data);
  };

  const fetchAlumnos = async () => {
    const { data, error } = await supabase
      .from("grupo_alumnos")
      .select("alumnos(id, nombre, apellido_paterno, apellido_materno, correo, telefono, cuatrimestre, plan_meses)")
      .eq("id_grupo", id_grupo);

    if (!error) {
      setAlumnos((data || []).map((rel) => rel.alumnos).filter(Boolean));
    }
  };

  const filteredAlumnos = alumnos.filter((a) => {
    const term = searchTerm.toLowerCase();
    return (
      a.nombre?.toLowerCase().includes(term) ||
      a.apellido_paterno?.toLowerCase().includes(term) ||
      a.apellido_materno?.toLowerCase().includes(term)
    );
  });

  if (loading || !autorizado) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar titulo="Mi Grupo" />
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar titulo="Mi Grupo" />

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <button
          onClick={() => navigate("/Dashboard")}
          className="inline-flex items-center gap-2 bg-white text-purple-700 font-semibold px-5 py-2.5 rounded-xl shadow-sm hover:bg-purple-50 border border-purple-200 transition-all duration-200 w-fit mb-6"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          <span>Regresar</span>
        </button>

        {grupo && (
          <div className="bg-white rounded-2xl shadow-md p-6 mb-8 border border-gray-100">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{grupo.nombre}</h1>
              <span
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
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
            </div>
            <p className="text-purple-700 font-medium mt-1">{grupo.carrera_nombre || "Sin carrera asignada"}</p>
            {grupo.tipo === "universidad" && grupo.cuatrimestre && (
              <p className="text-sm text-gray-500 mt-1">Cuatrimestre {grupo.cuatrimestre}</p>
            )}
            {grupo.tipo === "bachillerato" && grupo.semestre && (
              <p className="text-sm text-gray-500 mt-1">Semestre {grupo.semestre}</p>
            )}
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="relative w-full md:w-80">
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Buscar por nombre o apellido..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-white shadow-sm"
            />
          </div>
          <div className="text-sm text-gray-500 flex items-center gap-1.5">
            <FontAwesomeIcon icon={faUserGraduate} />
            {filteredAlumnos.length} alumno{filteredAlumnos.length === 1 ? "" : "s"}
          </div>
        </div>

        {/* Tabla escritorio */}
        <div className="hidden md:block w-full overflow-x-auto rounded-2xl shadow-md bg-white">
          <table className="w-full table-auto divide-y divide-gray-200">
            <thead className="bg-purple-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Correo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Teléfono</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                  {grupo?.tipo === "bachillerato" ? "Semestre" : grupo?.tipo === "autoplaneado" ? "Plan" : "Cuatrimestre"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAlumnos.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-gray-500 italic">
                    No hay alumnos que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredAlumnos.map((alumno) => (
                  <tr key={alumno.id} className="hover:bg-purple-50 transition">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {alumno.nombre} {alumno.apellido_paterno} {alumno.apellido_materno}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{alumno.correo}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{alumno.telefono || "-"}</td>
                    <td className="px-4 py-3 text-sm text-center">
                      <span className="inline-flex items-center justify-center bg-purple-100 text-purple-800 rounded-full px-2 py-0.5 text-xs">
                        {grupo?.tipo === "autoplaneado"
                          ? alumno.plan_meses
                            ? `${alumno.plan_meses} meses`
                            : "-"
                          : alumno.cuatrimestre || "-"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Tarjetas móvil */}
        <div className="md:hidden space-y-4">
          {filteredAlumnos.length === 0 ? (
            <div className="text-center text-gray-500 py-10 bg-white rounded-xl shadow">
              No hay alumnos que coincidan con la búsqueda.
            </div>
          ) : (
            filteredAlumnos.map((alumno) => (
              <div key={alumno.id} className="bg-white rounded-2xl shadow-md p-4 border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-gray-800">
                    {alumno.nombre} {alumno.apellido_paterno} {alumno.apellido_materno}
                  </h3>
                  <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2 py-1 rounded-full">
                    {grupo?.tipo === "bachillerato"
                      ? `Semestre ${alumno.cuatrimestre ?? "-"}`
                      : grupo?.tipo === "autoplaneado"
                      ? `Plan ${alumno.plan_meses ? `${alumno.plan_meses} meses` : "-"}`
                      : `Cuatrimestre ${alumno.cuatrimestre ?? "-"}`}
                  </span>
                </div>
                <p className="text-sm text-gray-600"><strong>Correo:</strong> {alumno.correo}</p>
                <p className="text-sm text-gray-600"><strong>Teléfono:</strong> {alumno.telefono || "-"}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
