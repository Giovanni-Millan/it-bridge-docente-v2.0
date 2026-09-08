// Navbar compartido por TODAS las páginas del portal del docente (cada
// pantalla solo le pasa `titulo`). Rediseñado (7-sep-2026) para traer 2
// accesos rápidos que antes solo vivían en el Dashboard o no existían:
//
// 1. Campanita de avisos: mismo contenido que la sección "Avisos importantes"
//    del Dashboard, pero disponible desde cualquier pantalla, con un badge
//    de "no leídos" (contra un timestamp guardado en localStorage — `avisos`
//    no tiene columna de lectura por usuario en la BD, así que esto es
//    puramente una conveniencia del navegador, igual que "recordarme" en
//    Login; no se sincroniza entre dispositivos).
// 2. Ícono de pendientes: badge con el total de alumnos sin calificación de
//    ESTE profesor (ver utils/pendientes.js) — al tocarlo, va directo a
//    /PendientesCalificaciones.
//
// Ambos se calculan una vez al montar el Navbar (o sea, en cada navegación,
// ya que el Navbar se remonta con cada página — no hay estado global en esta
// app). Si no hay sesión activa (no debería pasar: Login no usa este
// Navbar) simplemente se quedan en 0 sin tronar nada.
import React, { useEffect, useState } from "react";
import "./navbar.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faClipboardList, faCalendarDays } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { supabase } from "../supabaseClient";
import { calcularPendientesDocente } from "../utils/pendientes";

import logo from "../assets/logo.png";

const CLAVE_ULTIMA_VISTA = "docente_avisos_vistos_hasta";

export default function Navbar(props) {
  const navigate = useNavigate();

  const [avisos, setAvisos] = useState([]);
  const [noLeidos, setNoLeidos] = useState(0);
  const [pendientesCount, setPendientesCount] = useState(0);
  const [panelAvisosAbierto, setPanelAvisosAbierto] = useState(false);

  useEffect(() => {
    cargar();
  }, []);

  const cargar = async () => {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return;

    const [{ data: avisosData }, pendientesData] = await Promise.all([
      supabase.from("avisos").select("*").order("created_at", { ascending: false }),
      calcularPendientesDocente(userId),
    ]);

    setAvisos(avisosData || []);
    setPendientesCount(pendientesData.reduce((acc, a) => acc + a.alumnos.length, 0));

    const ultimaVista = localStorage.getItem(CLAVE_ULTIMA_VISTA);
    const noLeidosCalc = (avisosData || []).filter(
      (a) => !ultimaVista || new Date(a.created_at) > new Date(ultimaVista)
    ).length;
    setNoLeidos(noLeidosCalc);
  };

  const abrirPanelAvisos = () => {
    setPanelAvisosAbierto((abierto) => !abierto);
    // Abrir el panel ya cuenta como "vistos" — igual que la mayoría de
    // campanitas de notificaciones (Gmail, redes sociales, etc.).
    if (!panelAvisosAbierto && noLeidos > 0) {
      localStorage.setItem(CLAVE_ULTIMA_VISTA, new Date().toISOString());
      setNoLeidos(0);
    }
  };

  const verAviso = (aviso) => {
    const fecha = aviso.created_at
      ? new Date(aviso.created_at).toLocaleString("es-MX")
      : "Fecha no disponible";

    setPanelAvisosAbierto(false);
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

  const irAPendientes = () => {
    setPanelAvisosAbierto(false);
    navigate("/PendientesCalificaciones");
  };

  return (
    <nav className="relative bg-purple-950 flex justify-between items-center gap-3 py-3 px-3 sm:px-0">
      <div className="flex-shrink-0">
        <img src={logo} className="logo ml-2 sm:ml-5 bg-white rounded-full p-1" />
      </div>

      <div className="text-white font-thin text-lg sm:text-2xl md:text-3xl text-center truncate flex-1 px-2">
        {props.titulo}
      </div>

      <div className="flex-shrink-0 flex items-center gap-2 sm:gap-3 mr-2 sm:mr-5">
        {/* Ícono de pendientes: solo se muestra el badge si hay algo pendiente,
            pero el ícono siempre está para que sea un atajo predecible. */}
        <button
          onClick={irAPendientes}
          title="Pendientes de calificaciones"
          className="relative text-white/80 hover:text-white transition-colors p-2"
        >
          <FontAwesomeIcon icon={faClipboardList} className="text-lg sm:text-xl" />
          {pendientesCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-purple-950">
              {pendientesCount > 99 ? "99+" : pendientesCount}
            </span>
          )}
        </button>

        {/* Campanita de avisos */}
        <div className="relative">
          <button
            onClick={abrirPanelAvisos}
            title="Avisos"
            className="relative text-white/80 hover:text-white transition-colors p-2"
          >
            <FontAwesomeIcon icon={faBell} className="text-lg sm:text-xl" />
            {noLeidos > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-purple-950">
                {noLeidos > 99 ? "99+" : noLeidos}
              </span>
            )}
          </button>

          {panelAvisosAbierto && (
            <>
              {/* Overlay invisible para cerrar el panel al tocar fuera — mismo
                  patrón que el sidebar móvil del portal del alumno. */}
              <div className="fixed inset-0 z-30" onClick={() => setPanelAvisosAbierto(false)} />

              <div className="absolute right-0 mt-2 w-80 max-w-[85vw] bg-white rounded-2xl shadow-2xl border border-gray-100 z-40 overflow-hidden">
                <div className="px-4 py-3 bg-purple-50 border-b border-purple-100 flex items-center justify-between">
                  <span className="font-semibold text-purple-900 text-sm">Avisos</span>
                  <FontAwesomeIcon icon={faCalendarDays} className="text-purple-400 text-sm" />
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {avisos.length === 0 ? (
                    <p className="text-center text-gray-400 text-sm py-8 px-4">No hay avisos disponibles.</p>
                  ) : (
                    avisos.map((aviso) => (
                      <button
                        key={aviso.id_aviso}
                        onClick={() => verAviso(aviso)}
                        className="w-full text-left px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-purple-50 transition"
                      >
                        <p className="font-semibold text-gray-800 text-sm line-clamp-1">{aviso.titulo}</p>
                        <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{aviso.descripcion}</p>
                        {aviso.created_at && (
                          <p className="text-gray-400 text-[11px] mt-1">
                            {new Date(aviso.created_at).toLocaleDateString("es-MX")}
                          </p>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
