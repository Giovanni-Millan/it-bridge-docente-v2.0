import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import { supabase } from "../supabaseClient";

// Número de soporte del sistema Bridge. Si cambia, solo se actualiza aquí.
const NUMERO_SOPORTE = "525560784581"; // +52 1 55 6078 4581, formato wa.me (sin espacios ni signos)

export default function WhatsAppFloatingButton() {
  const [nombreProfesor, setNombreProfesor] = useState("");

  // Se carga una sola vez al montar (el botón vive en App.jsx, fuera de
  // Routes, así que no depende de que la página actual ya haya cargado el
  // perfil del profesor). En Login, antes de iniciar sesión, simplemente
  // no hay usuario todavía y el mensaje se arma sin nombre.
  useEffect(() => {
    const cargarNombreProfesor = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;
      if (!userId) return;

      const { data: perfil } = await supabase
        .from("profesores")
        .select("nombre, apellido_paterno, apellido_materno")
        .eq("id", userId)
        .single();

      if (perfil) {
        const nombreCompleto = `${perfil.nombre} ${perfil.apellido_paterno} ${
          perfil.apellido_materno || ""
        }`
          .replace(/\s+/g, " ")
          .trim();
        setNombreProfesor(nombreCompleto);
      }
    };

    cargarNombreProfesor();
  }, []);

  const mensaje = nombreProfesor
    ? `Hola, soy el/la profesor(a) ${nombreProfesor}. Tengo una duda o encontré una falla en el sistema Bridge:`
    : "Hola, tengo una duda o encontré una falla en el sistema Bridge:";

  const href = `https://wa.me/${NUMERO_SOPORTE}?text=${encodeURIComponent(mensaje)}`;

  return (
    <div className="fixed bottom-5 right-5 z-50 group">
      {/* Tooltip: oculto por defecto, aparece con hover/focus del botón */}
      <div
        role="tooltip"
        className="pointer-events-none absolute bottom-full right-0 mb-3 w-max max-w-[15rem] rounded-lg bg-gray-900 px-3 py-2 text-sm text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        ¿Tienes dudas o encontraste un bug? Escríbenos
        <div className="absolute right-5 top-full h-2 w-2 -mt-1 rotate-45 bg-gray-900" />
      </div>

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Reportar una falla o duda del sistema por WhatsApp"
        className="flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-lg hover:bg-[#20BD5A] hover:scale-105 active:scale-95 transition-transform"
      >
        <FontAwesomeIcon icon={faWhatsapp} className="text-3xl" />
      </a>
    </div>
  );
}
