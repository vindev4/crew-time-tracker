"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

type Lang = "en" | "es";

const translations: Record<string, Record<Lang, string>> = {
  // App title & nav
  "app.title": { en: "Crew Time Tracker", es: "Registro de Tiempo" },
  "app.subtitle": { en: "Enter your ID and PIN to punch", es: "Ingrese su ID y PIN para registrar" },
  "app.clockIn": { en: "Clock In", es: "Entrada" },
  "app.clockOut": { en: "Clock Out", es: "Salida" },
  "app.viewHistory": { en: "View My History", es: "Ver Mi Historial" },
  "app.submitTicket": { en: "Submit Ticket", es: "Enviar Ticket" },
  "app.dailyReport": { en: "Daily Field Report", es: "Reporte Diario de Campo" },
  "app.adminLogin": { en: "Admin Login", es: "Acceso Admin" },
  "app.employeeId": { en: "Employee ID", es: "ID de Empleado" },
  "app.pin": { en: "PIN", es: "PIN" },
  "app.backToClock": { en: "Back to Clock In/Out", es: "Volver a Entrada/Salida" },

  // Report form sections
  "report.title": { en: "Daily Field Report", es: "Reporte Diario de Campo" },
  "report.auth": { en: "Authentication", es: "Autenticación" },
  "report.jobSite": { en: "Job Site & Date", es: "Sitio de Trabajo y Fecha" },
  "report.crew": { en: "Crew Present", es: "Personal Presente" },
  "report.work": { en: "Work Performed", es: "Trabajo Realizado" },
  "report.equipment": { en: "Equipment Used", es: "Equipo Utilizado" },
  "report.materials": { en: "Materials Used", es: "Materiales Usados" },
  "report.safety": { en: "Safety", es: "Seguridad" },
  "report.subs": { en: "Subcontractors", es: "Subcontratistas" },
  "report.photos": { en: "Photos", es: "Fotos" },
  "report.notes": { en: "Notes & Sign-Off", es: "Notas y Firma" },

  // Section 1 - Job Site
  "field.reportDate": { en: "Report Date", es: "Fecha del Reporte" },
  "field.projectName": { en: "Project / Job Name", es: "Nombre del Proyecto" },
  "field.projectNumber": { en: "Project Number", es: "Número de Proyecto" },
  "field.siteAddress": { en: "Site Address", es: "Dirección del Sitio" },
  "field.foreman": { en: "Foreman / Supervisor", es: "Capataz / Supervisor" },
  "field.weather": { en: "Weather", es: "Clima" },
  "field.temperature": { en: "Temperature", es: "Temperatura" },
  "field.weatherImpact": { en: "Weather impacted work?", es: "¿El clima afectó el trabajo?" },
  "field.weatherNotes": { en: "Describe how weather impacted work...", es: "Describa cómo el clima afectó el trabajo..." },
  "field.select": { en: "Select...", es: "Seleccione..." },
  "field.optional": { en: "Optional", es: "Opcional" },

  // Section 2 - Crew
  "crew.member": { en: "Crew Member", es: "Miembro del Equipo" },
  "crew.remove": { en: "Remove", es: "Eliminar" },
  "crew.selectEmployee": { en: "Select employee...", es: "Seleccione empleado..." },
  "crew.regHours": { en: "Reg Hours", es: "Horas Reg" },
  "crew.otHours": { en: "OT Hours", es: "Horas Extra" },
  "crew.role": { en: "Role", es: "Rol" },
  "crew.add": { en: "+ Add Crew Member", es: "+ Agregar Miembro" },

  // Section 3 - Work
  "work.description": { en: "Work Description", es: "Descripción del Trabajo" },
  "work.descPlaceholder": { en: "What was accomplished today...", es: "Qué se logró hoy..." },
  "work.type": { en: "Type of Work", es: "Tipo de Trabajo" },
  "work.phase": { en: "Phase of Work", es: "Fase del Trabajo" },
  "work.phasePlaceholder": { en: "e.g. Foundation pour - north wing", es: "ej. Vaciado de cimentación - ala norte" },
  "work.percentComplete": { en: "Percent Complete", es: "Porcentaje Completado" },
  "work.delays": { en: "Delays encountered?", es: "¿Hubo retrasos?" },
  "work.delayNotes": { en: "Describe delays...", es: "Describa los retrasos..." },
  "work.extraWork": { en: "Extra work / change orders?", es: "¿Trabajo extra / órdenes de cambio?" },
  "work.extraNotes": { en: "Describe scope changes...", es: "Describa los cambios de alcance..." },

  // Section 4 - Equipment
  "equip.item": { en: "Equipment", es: "Equipo" },
  "equip.name": { en: "Equipment name (e.g. CAT 320 Excavator)", es: "Nombre del equipo (ej. Excavadora CAT 320)" },
  "equip.id": { en: "ID / Unit #", es: "ID / Unidad #" },
  "equip.hours": { en: "Hours", es: "Horas" },
  "equip.operator": { en: "Operator name", es: "Nombre del operador" },
  "equip.issues": { en: "Issues (optional)", es: "Problemas (opcional)" },
  "equip.add": { en: "+ Add Equipment", es: "+ Agregar Equipo" },

  // Section 5 - Materials
  "mat.item": { en: "Material", es: "Material" },
  "mat.description": { en: "Material description", es: "Descripción del material" },
  "mat.qty": { en: "Qty", es: "Cant" },
  "mat.supplier": { en: "Supplier", es: "Proveedor" },
  "mat.add": { en: "+ Add Material", es: "+ Agregar Material" },

  // Section 6 - Safety
  "safety.briefing": { en: "Safety briefing held today?", es: "¿Se realizó reunión de seguridad?" },
  "safety.ppe": { en: "All crew PPE compliant?", es: "¿Todo el personal cumple con EPP?" },
  "safety.incidents": { en: "Any incidents occurred?", es: "¿Ocurrieron incidentes?" },
  "safety.incidentDesc": { en: "Describe the incident...", es: "Describa el incidente..." },
  "safety.reportedTo": { en: "Reported to (name/role)", es: "Reportado a (nombre/cargo)" },
  "safety.nearMisses": { en: "Any near misses?", es: "¿Hubo cuasi-accidentes?" },
  "safety.nearMissNotes": { en: "Describe near miss...", es: "Describa el cuasi-accidente..." },
  "safety.hazards": { en: "Hazards Identified", es: "Peligros Identificados" },
  "safety.hazardsPlaceholder": { en: "Site conditions, utility strikes, overhead lines...", es: "Condiciones del sitio, golpes de utilidades, líneas aéreas..." },
  "safety.visitors": { en: "Visitors on Site", es: "Visitantes en el Sitio" },
  "safety.visitorsPlaceholder": { en: "Names / companies (optional)", es: "Nombres / empresas (opcional)" },

  // Section 7 - Subcontractors
  "sub.item": { en: "Subcontractor", es: "Subcontratista" },
  "sub.company": { en: "Company name", es: "Nombre de la empresa" },
  "sub.trade": { en: "Trade", es: "Oficio" },
  "sub.workers": { en: "# Workers", es: "# Trabajadores" },
  "sub.workDesc": { en: "Work performed", es: "Trabajo realizado" },
  "sub.add": { en: "+ Add Subcontractor", es: "+ Agregar Subcontratista" },

  // Section 8 - Photos
  "photos.upload": { en: "Upload Photos", es: "Subir Fotos" },
  "photos.tap": { en: "Tap to take or select photos", es: "Toque para tomar o seleccionar fotos" },
  "photos.caption": { en: "Caption (optional)", es: "Descripción (opcional)" },
  "photos.remove": { en: "Remove", es: "Eliminar" },
  "photos.max": { en: "Max 10 photos, 10MB each", es: "Máx 10 fotos, 10MB cada una" },

  // Section 9 - Notes
  "notes.additional": { en: "Additional Notes", es: "Notas Adicionales" },
  "notes.placeholder": { en: "Any other notes, observations...", es: "Otras notas, observaciones..." },
  "notes.confirm": { en: "I confirm this report is accurate", es: "Confirmo que este reporte es preciso" },

  // Buttons
  "btn.next": { en: "Next", es: "Siguiente" },
  "btn.back": { en: "Back", es: "Atrás" },
  "btn.submit": { en: "Submit Report", es: "Enviar Reporte" },
  "btn.submitting": { en: "Submitting...", es: "Enviando..." },

  // Errors
  "error.idPin": { en: "Enter your ID and PIN", es: "Ingrese su ID y PIN" },
  "error.idPinRequired": { en: "Employee ID and PIN are required", es: "ID de empleado y PIN son requeridos" },
  "error.punchFailed": { en: "Punch failed", es: "Registro fallido" },
  "error.connectionError": { en: "Connection error", es: "Error de conexión" },
  "error.submitFailed": { en: "Failed to submit report", es: "Error al enviar el reporte" },
};

interface I18nContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  lang: "en",
  setLang: () => {},
  t: (key: string) => key,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");

  const t = useCallback(
    (key: string) => {
      return translations[key]?.[lang] || key;
    },
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

export function LanguageToggle() {
  const { lang, setLang } = useI18n();
  return (
    <button
      onClick={() => setLang(lang === "en" ? "es" : "en")}
      className="fixed top-3 right-3 z-50 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-full text-sm font-medium transition-colors border border-gray-600"
      title={lang === "en" ? "Cambiar a Español" : "Switch to English"}
    >
      {lang === "en" ? "🇪🇸 ES" : "🇺🇸 EN"}
    </button>
  );
}
