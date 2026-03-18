"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lang, setLang] = useState<"en" | "es">("en");

  useEffect(() => {
    const savedLang = document.cookie
      .split("; ")
      .find((row) => row.startsWith("lang="))
      ?.split("=")[1] as "en" | "es" | undefined;
    if (savedLang) setLang(savedLang);
  }, []);

  const handleLangChange = (newLang: "en" | "es") => {
    setLang(newLang);
    document.cookie = `lang=${newLang}; path=/; max-age=31536000`;
  };

  const t = {
    en: {
      title: "Admin Login",
      subtitle: "DuraPort Management",
      username: "Username",
      password: "Password",
      signIn: "Sign In",
      signingIn: "Signing in...",
      usernameRequired: "Enter username and password",
      networkError: "Network error. Please try again.",
      employeeLogin: "Employee Login",
    },
    es: {
      title: "Inicio de Sesión Admin",
      subtitle: "Gestión de DuraPort",
      username: "Usuario",
      password: "Contraseña",
      signIn: "Iniciar Sesión",
      signingIn: "Iniciando sesión...",
      usernameRequired: "Ingrese usuario y contraseña",
      networkError: "Error de conexión. Intente de nuevo.",
      employeeLogin: "Inicio de Sesión Empleado",
    },
  };

  const translations = t[lang];

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    if (!username || !password) {
      setError(translations.usernameRequired);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/time/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/admin/dashboard");
      } else {
        setError(data.error || "Login failed");
      }
    } catch {
      setError(translations.networkError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#00467F] flex flex-col items-center justify-center max-w-md mx-auto px-5">
      <div className="w-full">
        {/* Logo */}
        <div className="text-center mb-12">
          <img src="https://duraport.net/wp-content/uploads/2026/01/duraport-logo.svg" alt="DuraPort" className="h-8 opacity-90 mx-auto" />
        </div>

        {/* Language Toggle */}
        <div className="flex gap-2 justify-center mb-8">
          <button
            onClick={() => handleLangChange("en")}
            className={`px-3 py-1 text-xs uppercase tracking-wider rounded-md transition-colors ${
              lang === "en"
                ? "bg-[#F37C05] text-white/90"
                : "bg-white/5 border border-white/10 text-white/40 hover:bg-white/10"
            }`}
          >
            EN
          </button>
          <button
            onClick={() => handleLangChange("es")}
            className={`px-3 py-1 text-xs uppercase tracking-wider rounded-md transition-colors ${
              lang === "es"
                ? "bg-[#F37C05] text-white/90"
                : "bg-white/5 border border-white/10 text-white/40 hover:bg-white/10"
            }`}
          >
            ES
          </button>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-light text-white/90 mb-2">
            {translations.title}
          </h1>
          <p className="text-white/40 text-xs uppercase tracking-wider">
            {translations.subtitle}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="w-full">
          {error && (
            <div className="bg-white/5 border border-white/10 text-white/70 px-4 py-3 rounded-xl mb-6 text-sm">
              {error}
            </div>
          )}

          <div className="mb-6">
            <label className="text-white/40 text-xs uppercase tracking-wider block mb-3">
              {translations.username}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/90 placeholder-white/20 focus:outline-none focus:border-[#F37C05] focus:bg-white/10 transition-colors"
              disabled={loading}
              placeholder=""
            />
          </div>

          <div className="mb-8">
            <label className="text-white/40 text-xs uppercase tracking-wider block mb-3">
              {translations.password}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/90 placeholder-white/20 focus:outline-none focus:border-[#F37C05] focus:bg-white/10 transition-colors"
              disabled={loading}
              placeholder=""
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#F37C05] hover:bg-[#E37005] disabled:bg-[#F37C05]/50 text-white font-light py-3 rounded-xl transition-colors uppercase tracking-wide text-sm"
          >
            {loading ? translations.signingIn : translations.signIn}
          </button>
        </form>

        {/* Employee Login Link */}
        <div className="text-center mt-8">
          <a
            href="/time/login"
            className="text-white/40 text-xs hover:text-white/60 transition-colors"
          >
            {translations.employeeLogin}
          </a>
        </div>
      </div>
    </div>
  );
}
