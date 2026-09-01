import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";

// Número de soporte del sistema Bridge. Si cambia, solo se actualiza aquí.
const NUMERO_SOPORTE = "525560784581"; // +52 1 55 6078 4581, formato wa.me (sin espacios ni signos)
const MENSAJE_PREDETERMINADO =
  "Hola, tengo una duda o encontré una falla en el sistema Bridge:";

export default function WhatsAppFloatingButton() {
  const href = `https://wa.me/${NUMERO_SOPORTE}?text=${encodeURIComponent(
    MENSAJE_PREDETERMINADO
  )}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Reportar una falla o duda del sistema por WhatsApp"
      title="¿Dudas o fallas del sistema? Escríbenos por WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-lg hover:bg-[#20BD5A] hover:scale-105 active:scale-95 transition-transform"
    >
      <FontAwesomeIcon icon={faWhatsapp} className="text-3xl" />
    </a>
  );
}
