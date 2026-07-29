import React, { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { supabase } from "../../supabaseClient";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faSave, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import Avatar from "../../components/Avatar.jsx";

export default function CalificarUniversidad() {
  const { id_grupo } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [materia, setMateria] = useState(location.state?.materia || "");
  const [grupo, setGrupo] = useState(null);
  const [alumnos, setAlumnos] = useState([]);
  const [calificaciones, setCalificaciones] = useState({}); // correo -> calificacion
  const [valoresEditables, setValoresEditables] = useState({}); // id_alumno -> texto en el input
  const [capturaHabilitada, setCapturaHabilitada] = useState(false);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [autorizado, setAutorizado] = useState(false);

  useEffect(() => {
    inicializar();
  }, [id_grupo]);

  const inicializar = async () => {
    setLoading(true);

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      navigate("/");
      return;
    }

    const { data: asignacion, error: asignacionError } = await supabase
      .from("grupo_profesores")
      .select("materia")
      .eq("id_grupo", id_grupo)
      .eq("id_profesor", userData.user.id)
      .maybeSingle();

    if (asignacionError || !asignacion) {
      Swal.fire({
        icon: "warning",
        title: "Sin acceso",
        text: "Este grupo no está asignado a tu cuenta.",
        confirmButtonColor: "#7c3aed",
      }).then(() => navigate("/Dashboard"));
      return;
    }

    const materiaFinal = location.state?.materia || asignacion.materia;
    setMateria(materiaFinal);

    const [{ data: config }, { data: grupoData }, { data: alumnosData }] = await Promise.all([
      supabase.from("configuracion_sistema").select("captura_calificaciones_habilitada").eq("id", 1).single(),
      supabase.from("vista_grupos_resumen").select("*").eq("id_grupo", id_grupo).single(),
      supabase
        .from("grupo_alumnos")
        .select("alumnos(id, nombre, apellido_paterno, apellido_materno, correo, foto_url)")
        .eq("id_grupo", id_grupo),
    ]);

    setCapturaHabilitada(!!config?.captura_calificaciones_habilitada);
    setGrupo(grupoData || null);
    const roster = (alumnosData || []).map((rel) => rel.alumnos).filter(Boolean);
    setAlumnos(roster);

    await fetchCalificaciones(roster, materiaFinal);
    setAutorizado(true);
    setLoading(false);
  };

  const fetchCalificaciones = async (roster, materiaParam) => {
    const correos = roster.map((a) => a.correo).filter(Boolean);
    if (correos.length === 0) {
      setCalificaciones({});
      return;
    }

    const { data, error } = await supabase
      .from("calificaciones")
      .select("correo, calificacion")
      .eq("materia", materiaParam)
      .in("correo", correos);

    if (error) return;

    const mapa = {};
    (data || []).forEach((fila) => {
      mapa[fila.correo] = fila.calificacion;
    });
    setCalificaciones(mapa);
    setValoresEditables({});
  };

  const handleInputChange = (id_alumno, valor) => {
    setValoresEditables((prev) => ({ ...prev, [id_alumno]: valor }));
  };

  const handleGuardar = async () => {
    const filas = alumnos
      .filter((a) => valoresEditables[a.id] !== undefined && valoresEditables[a.id] !== "")
      .map((a) => ({
        correo: a.correo,
        id_alumno: a.id,
        materia,
        calificacion: Number(valoresEditables[a.id]),
        fecha_registro: new Date().toISOString(),
        periodo_cuatrimestre: grupo?.periodo || null,
        ano_cuatrimestre: grupo?.anio || null,
      }));

    if (filas.length === 0) {
      Swal.fire("Nada que guardar", "Captura al menos una calificación.", "info");
      return;
    }

    const calificacionesInvalidas = filas.some((f) => Number.isNaN(f.calificacion) || f.calificacion < 1 || f.calificacion > 10);
    if (calificacionesInvalidas) {
      Swal.fire("Calificación inválida", "Las calificaciones deben ser un número entre 1 y 10.", "warning");
      return;
    }

    setGuardando(true);
    const { error } = await supabase
      .from("calificaciones")
      .upsert(filas, { onConflict: "correo,materia" });
    setGuardando(false);

    if (error) {
      console.error(error);
      Swal.fire("Error", "No se pudieron guardar las calificaciones. " + error.message, "error");
      return;
    }

    Swal.fire({
      title: "Calificaciones guardadas",
      icon: "success",
      timer: 1500,
      showConfirmButton: false,
    });

    fetchCalificaciones(alumnos, materia);
  };

  if (loading || !autorizado) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar titulo="Calificar Grupo" />
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar titulo="Calificar Grupo" />

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <button
          onClick={() => navigate("/Dashboard")}
          className="inline-flex items-center gap-2 bg-white text-purple-700 font-semibold px-5 py-2.5 rounded-xl shadow-sm hover:bg-purple-50 border border-purple-200 transition-all duration-200 w-fit mb-6"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          <span>Regresar</span>
        </button>

        {grupo && (
          <div className="bg-white rounded-2xl shadow-md p-6 mb-6 border border-gray-100">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{grupo.nombre}</h1>
            <p className="text-purple-700 font-medium mt-1">{materia}</p>
            {grupo.cuatrimestre && <p className="text-sm text-gray-500 mt-1">Cuatrimestre {grupo.cuatrimestre}</p>}
          </div>
        )}

        {!capturaHabilitada ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
            <FontAwesomeIcon icon={faTriangleExclamation} className="text-amber-500 text-3xl mb-3" />
            <p className="text-amber-800 font-medium">
              La captura de calificaciones no está habilitada en este momento. Contacta al administrador.
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
              <table className="w-full table-auto divide-y divide-gray-200">
                <thead className="bg-purple-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Alumno</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider w-40">
                      Calificación (1-10)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {alumnos.length === 0 ? (
                    <tr>
                      <td colSpan="2" className="text-center py-8 text-gray-500 italic">
                        Este grupo aún no tiene alumnos asignados.
                      </td>
                    </tr>
                  ) : (
                    alumnos.map((alumno) => (
                      <tr key={alumno.id} className="hover:bg-purple-50 transition">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <div className="flex items-center gap-3">
                            <Avatar
                              fotoUrl={alumno.foto_url}
                              nombre={alumno.nombre}
                              apellidoPaterno={alumno.apellido_paterno}
                              apellidoMaterno={alumno.apellido_materno}
                              size={32}
                            />
                            {alumno.nombre} {alumno.apellido_paterno} {alumno.apellido_materno}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="number"
                            min="1"
                            max="10"
                            step="0.1"
                            defaultValue={calificaciones[alumno.correo] ?? ""}
                            onChange={(e) => handleInputChange(alumno.id, e.target.value)}
                            className="w-24 text-center border border-gray-300 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-purple-400 focus:border-transparent"
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {alumnos.length > 0 && (
              <div className="flex justify-end mt-6">
                <button
                  onClick={handleGuardar}
                  disabled={guardando}
                  className="inline-flex items-center gap-2 bg-purple-700 hover:bg-purple-800 disabled:opacity-60 text-white font-semibold px-6 py-3 rounded-xl shadow-sm transition-all"
                >
                  <FontAwesomeIcon icon={faSave} />
                  {guardando ? "Guardando..." : "Guardar calificaciones"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
