import React, { useEffect, useRef, useState } from "react";
import Navbar from "../../components/Navbar";
import { supabase } from "../../supabaseClient";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faSave, faCalendarDays, faFilePdf, faFileExcel } from "@fortawesome/free-solid-svg-icons";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import Avatar from "../../components/Avatar.jsx";

const ETIQUETAS_ESTADO = { presente: "Presente", falta: "Falta", retardo: "Retardo", justificado: "Justificado" };

const ESTADOS = [
  { valor: "presente", etiqueta: "Presente", activo: "bg-green-600 text-white", inactivo: "bg-green-50 text-green-700 hover:bg-green-100" },
  { valor: "falta", etiqueta: "Falta", activo: "bg-red-600 text-white", inactivo: "bg-red-50 text-red-700 hover:bg-red-100" },
  { valor: "retardo", etiqueta: "Retardo", activo: "bg-amber-600 text-white", inactivo: "bg-amber-50 text-amber-700 hover:bg-amber-100" },
  { valor: "justificado", etiqueta: "Justificado", activo: "bg-blue-600 text-white", inactivo: "bg-blue-50 text-blue-700 hover:bg-blue-100" },
];

const hoyISO = () => new Date().toLocaleDateString("sv-SE"); // YYYY-MM-DD en horario local

export default function TomarAsistencia() {
  const { id_grupo } = useParams();
  const navigate = useNavigate();

  const [grupo, setGrupo] = useState(null);
  const [alumnos, setAlumnos] = useState([]);
  const [fecha, setFecha] = useState(hoyISO());
  const [estados, setEstados] = useState({}); // id_alumno -> estado
  const [loading, setLoading] = useState(true);
  const [cargandoFecha, setCargandoFecha] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [autorizado, setAutorizado] = useState(false);
  const [userId, setUserId] = useState(null);
  const fechaInputRef = useRef(null);

  useEffect(() => {
    inicializar();
  }, [id_grupo]);

  useEffect(() => {
    if (autorizado) fetchAsistencia(fecha);
  }, [fecha, autorizado]);

  const inicializar = async () => {
    setLoading(true);

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      navigate("/");
      return;
    }

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

    setUserId(userData.user.id);

    const [{ data: grupoData }, { data: alumnosData }] = await Promise.all([
      supabase.from("vista_grupos_resumen").select("*").eq("id_grupo", id_grupo).single(),
      supabase
        .from("grupo_alumnos")
        .select("alumnos(id, nombre, apellido_paterno, apellido_materno, foto_url)")
        .eq("id_grupo", id_grupo),
    ]);

    setGrupo(grupoData || null);
    setAlumnos(
      (alumnosData || [])
        .map((rel) => rel.alumnos)
        .filter(Boolean)
        .sort((a, b) =>
          `${a.apellido_paterno || ""} ${a.apellido_materno || ""} ${a.nombre || ""}`.localeCompare(
            `${b.apellido_paterno || ""} ${b.apellido_materno || ""} ${b.nombre || ""}`,
            "es"
          )
        )
    );
    setAutorizado(true);
    setLoading(false);
  };

  const fetchAsistencia = async (fechaConsultada) => {
    setCargandoFecha(true);
    const { data, error } = await supabase
      .from("asistencias")
      .select("id_alumno, estado")
      .eq("id_grupo", id_grupo)
      .eq("fecha", fechaConsultada);

    if (!error) {
      const mapa = {};
      (data || []).forEach((fila) => (mapa[fila.id_alumno] = fila.estado));
      setEstados(mapa);
    }
    setCargandoFecha(false);
  };

  const marcarEstado = (id_alumno, estado) => {
    setEstados((prev) => ({ ...prev, [id_alumno]: estado }));
  };

  const handleGuardar = async () => {
    const filas = alumnos
      .filter((a) => estados[a.id])
      .map((a) => ({
        id_grupo: Number(id_grupo),
        id_alumno: a.id,
        id_profesor: userId,
        fecha,
        estado: estados[a.id],
      }));

    if (filas.length === 0) {
      Swal.fire("Nada que guardar", "Marca la asistencia de al menos un alumno.", "info");
      return;
    }

    setGuardando(true);
    const { error } = await supabase
      .from("asistencias")
      .upsert(filas, { onConflict: "id_grupo,id_alumno,fecha" });
    setGuardando(false);

    if (error) {
      console.error(error);
      Swal.fire("Error", "No se pudo guardar la asistencia. " + error.message, "error");
      return;
    }

    Swal.fire({
      title: "Asistencia guardada",
      icon: "success",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const filasParaExportar = () =>
    alumnos.map((a) => ({
      Alumno: `${a.nombre} ${a.apellido_paterno} ${a.apellido_materno || ""}`.trim(),
      Estado: ETIQUETAS_ESTADO[estados[a.id]] || "Sin registrar",
    }));

  const exportPDF = () => {
    if (alumnos.length === 0) {
      Swal.fire("Sin datos", "No hay alumnos para exportar.", "warning");
      return;
    }
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(85, 26, 139);
    doc.text(`Asistencia · ${grupo?.nombre || ""} · ${fechaLegible}`, 14, 20);
    autoTable(doc, {
      startY: 30,
      head: [["Alumno", "Estado"]],
      body: filasParaExportar().map((f) => [f.Alumno, f.Estado]),
    });
    doc.save(`asistencia_${grupo?.nombre || "grupo"}_${fecha}.pdf`);
  };

  const exportExcel = () => {
    if (alumnos.length === 0) {
      Swal.fire("Sin datos", "No hay alumnos para exportar.", "warning");
      return;
    }
    const worksheet = XLSX.utils.json_to_sheet(filasParaExportar());
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Asistencia");
    XLSX.writeFile(workbook, `asistencia_${grupo?.nombre || "grupo"}_${fecha}.xlsx`);
  };

  const fechaLegible = new Date(fecha + "T00:00:00").toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (loading || !autorizado) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Navbar titulo="Pase de Lista" />
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar titulo="Pase de Lista" />

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <button
          onClick={() => navigate("/Dashboard")}
          className="inline-flex items-center gap-2 bg-white text-purple-700 font-semibold px-5 py-2.5 rounded-xl shadow-sm hover:bg-purple-50 border border-purple-200 transition-all duration-200 w-fit mb-6"
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          <span>Regresar</span>
        </button>

        <div className="bg-white rounded-2xl shadow-md p-6 mb-6 border border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            {grupo && (
              <>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{grupo.nombre}</h1>
                <p className="text-purple-700 font-medium mt-1">{grupo.carrera_nombre || "Sin carrera asignada"}</p>
                {grupo.tipo === "bachillerato"
                  ? grupo.semestre && <p className="text-sm text-gray-500 mt-1">Semestre {grupo.semestre}</p>
                  : grupo.cuatrimestre && <p className="text-sm text-gray-500 mt-1">Cuatrimestre {grupo.cuatrimestre}</p>}
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => fechaInputRef.current?.showPicker?.() ?? fechaInputRef.current?.focus()}
                className="inline-flex items-center gap-2 bg-white border border-purple-200 rounded-xl px-4 py-2.5 shadow-sm cursor-pointer hover:bg-purple-50 transition"
              >
                <FontAwesomeIcon icon={faCalendarDays} className="text-purple-600" />
                <span className="text-gray-700 font-medium capitalize">{fechaLegible}</span>
              </button>
              <input
                ref={fechaInputRef}
                type="date"
                value={fecha}
                max={hoyISO()}
                onChange={(e) => setFecha(e.target.value)}
                className="sr-only"
                tabIndex={-1}
              />
            </div>
            <button
              type="button"
              onClick={() => setFecha(hoyISO())}
              className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-600 rounded-xl px-4 py-2.5 shadow-sm hover:bg-gray-50 transition text-sm font-medium"
            >
              Hoy
            </button>
            <button
              onClick={exportExcel}
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all"
            >
              <FontAwesomeIcon icon={faFileExcel} />
              Excel
            </button>
            <button
              onClick={exportPDF}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all"
            >
              <FontAwesomeIcon icon={faFilePdf} />
              PDF
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-x-auto relative">
          {cargandoFecha && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          )}
          <table className="w-full min-w-[560px] table-auto divide-y divide-gray-200">
            <thead className="bg-purple-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">Alumno</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider">Asistencia</th>
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
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2 flex-wrap">
                        {ESTADOS.map((op) => (
                          <button
                            key={op.valor}
                            type="button"
                            onClick={() => marcarEstado(alumno.id, op.valor)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide transition ${
                              estados[alumno.id] === op.valor ? op.activo : op.inactivo
                            }`}
                          >
                            {op.etiqueta}
                          </button>
                        ))}
                      </div>
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
              {guardando ? "Guardando..." : "Guardar asistencia"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
