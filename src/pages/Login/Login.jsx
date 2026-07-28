import React, { useState } from "react";
import logo from "./../../assets/logo.png";
import Swal from "sweetalert2";
import { supabase } from "../../supabaseClient";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faLock, faRightToBracket } from "@fortawesome/free-solid-svg-icons";

export default function Login() {
  const [correo, setCorreo] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: correo.trim(),
        password: contraseña,
      });

      if (error) {
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Correo o contraseña incorrectos",
          confirmButtonColor: "#6b21a5",
        });
        return;
      }

      if (data.user?.app_metadata?.rol !== "docente") {
        await supabase.auth.signOut();
        Swal.fire({
          icon: "error",
          title: "Sin acceso",
          text: "Esta cuenta no tiene permiso para acceder al Portal del Docente.",
          confirmButtonColor: "#6b21a5",
        });
        return;
      }

      Swal.fire({
        title: "Bienvenido al sistema",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });

      window.location.href = "/Dashboard";
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Error inesperado",
        text: "Por favor, intenta de nuevo más tarde.",
        confirmButtonColor: "#6b21a5",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-tr from-purple-950 to-purple-700 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8">
          <div className="flex justify-center mb-6">
            <div className="bg-white rounded-full p-3 shadow-md">
              <img src={logo} alt="Logo Escolar" className="h-16 w-auto md:h-20" />
            </div>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold text-center bg-gradient-to-r from-purple-900 to-purple-700 bg-clip-text text-transparent">
            Portal del Docente
          </h1>
          <p className="text-purple-600 text-center text-sm mt-1 mb-6">
            Espacio para profesores
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <label className="block text-sm font-semibold text-purple-800 ml-1">
                Correo electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faEnvelope} className="text-purple-400" />
                </div>
                <input
                  type="email"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition"
                  placeholder="tunombre@itbridge.edu.mx"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-semibold text-purple-800 ml-1">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FontAwesomeIcon icon={faLock} className="text-purple-400" />
                </div>
                <input
                  type="password"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent transition"
                  placeholder="••••••••"
                  value={contraseña}
                  onChange={(e) => setContraseña(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-700 to-purple-900 hover:from-purple-800 hover:to-purple-950 text-white font-bold py-2.5 rounded-xl shadow-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <FontAwesomeIcon icon={faRightToBracket} />
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

          <div className="mt-8 text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-purple-200"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 py-1 rounded-full text-purple-500">
                  Sistema escolar seguro
                </span>
              </div>
            </div>
            <p className="text-xs text-purple-400 mt-4">
              Acceso exclusivo para profesores dados de alta por el administrador
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
