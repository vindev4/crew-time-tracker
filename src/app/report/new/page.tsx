"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useI18n, LanguageToggle } from "@/lib/i18n";

interface Employee {
  id: string;
  employee_id: string;
  name: string;
  role: string;
}

interface CrewRow {
  employee_id: string;
  hours_regular: number;
  hours_overtime: number;
  role_on_site: string;
}

interface EquipmentRow {
  equipment_name: string;
  equipment_id_number: string;
  hours_used: number;
  operator_name: string;
  equipment_issues: string;
}

interface MaterialRow {
  material_description: string;
  quantity: number;
  unit: string;
  supplier: string;
}

interface SubRow {
  company_name: string;
  trade: string;
  worker_count: number;
  work_description: string;
}

interface PhotoItem {
  file: File;
  preview: string;
  caption: string;
  uploading: boolean;
  uploaded: boolean;
  url?: string;
  path?: string;
}

const WORK_TYPES = [
  "Excavation", "Concrete", "Framing", "Electrical", "Plumbing",
  "Grading", "Paving", "Demo", "Inspection", "Roofing",
  "HVAC", "Painting", "Landscaping", "Other",
];

const WEATHER_OPTIONS = ["Clear", "Cloudy", "Rainy", "Windy", "Hot", "Cold", "Other"];
const TEMP_RANGES = ["<32°F", "32–55°F", "55–75°F", "75–90°F", "90°F+"];
const UNITS = ["each", "lbs", "tons", "yards", "SF", "LF", "gallons", "bags"];

export default function DailyReportPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [currentSection, setCurrentSection] = useState(0);

  // Auth
  const [employeeId, setEmployeeId] = useState("");
  const [pin, setPin] = useState("");

  // Section 1 - Job Site
  const [reportDate, setReportDate] = useState(new Date().toISOString().split("T")[0]);
  const [projectName, setProjectName] = useState("");
  const [projectNumber, setProjectNumber] = useState("");
  const [siteAddress, setSiteAddress] = useState("");
  const [foremanId, setForemanId] = useState("");
  const [weather, setWeather] = useState("");
  const [tempRange, setTempRange] = useState("");
  const [weatherImpact, setWeatherImpact] = useState(false);
  const [weatherNotes, setWeatherNotes] = useState("");

  // Section 2 - Crew
  const [crew, setCrew] = useState<CrewRow[]>([]);

  // Section 3 - Work
  const [workDescription, setWorkDescription] = useState("");
  const [workTypes, setWorkTypes] = useState<string[]>([]);
  const [phaseOfWork, setPhaseOfWork] = useState("");
  const [percentComplete, setPercentComplete] = useState(0);
  const [delays, setDelays] = useState(false);
  const [delayNotes, setDelayNotes] = useState("");
  const [extraWork, setExtraWork] = useState(false);
  const [extraWorkNotes, setExtraWorkNotes] = useState("");

  // Section 4 - Equipment
  const [equipment, setEquipment] = useState<EquipmentRow[]>([]);

  // Section 5 - Materials
  const [materials, setMaterials] = useState<MaterialRow[]>([]);

  // Section 6 - Safety
  const [safetyBriefing, setSafetyBriefing] = useState(false);
  const [ppeCompliant, setPpeCompliant] = useState(false);
  const [incidents, setIncidents] = useState(false);
  const [incidentDesc, setIncidentDesc] = useState("");
  const [incidentReportedTo, setIncidentReportedTo] = useState("");
  const [nearMisses, setNearMisses] = useState(false);
  const [nearMissNotes, setNearMissNotes] = useState("");
  const [hazards, setHazards] = useState("");
  const [visitors, setVisitors] = useState("");

  // Section 7 - Subs
  const [subs, setSubs] = useState<SubRow[]>([]);

  // Section 8 - Photos
  const [photos, setPhotos] = useState<PhotoItem[]>([]);

  // Section 9 - Notes & Sign-Off
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [foremanConfirmed, setForemanConfirmed] = useState(false);

  useEffect(() => {
    fetch("/time/api/employees/list")
      .then((r) => r.json())
      .then((d) => setEmployees(d.employees || []))
      .catch(() => {});
  }, []);

  const sections = [
    t("report.auth"),
    t("report.jobSite"),
    t("report.crew"),
    t("report.work"),
    t("report.equipment"),
    t("report.materials"),
    t("report.safety"),
    t("report.subs"),
    t("report.photos"),
    t("report.notes"),
  ];

  function toggleWorkType(wt: string) {
    setWorkTypes((prev) => prev.includes(wt) ? prev.filter((x) => x !== wt) : [...prev, wt]);
  }

  // Crew helpers
  function addCrewRow() { setCrew([...crew, { employee_id: "", hours_regular: 8, hours_overtime: 0, role_on_site: "" }]); }
  function updateCrew(i: number, field: string, value: string | number) { const u = [...crew]; (u[i] as Record<string, unknown>)[field] = value; setCrew(u); }
  function removeCrew(i: number) { setCrew(crew.filter((_, idx) => idx !== i)); }

  // Equipment helpers
  function addEquipment() { setEquipment([...equipment, { equipment_name: "", equipment_id_number: "", hours_used: 0, operator_name: "", equipment_issues: "" }]); }
  function updateEquipment(i: number, field: string, value: string | number) { const u = [...equipment]; (u[i] as Record<string, unknown>)[field] = value; setEquipment(u); }
  function removeEquipment(i: number) { setEquipment(equipment.filter((_, idx) => idx !== i)); }

  // Material helpers
  function addMaterial() { setMaterials([...materials, { material_description: "", quantity: 0, unit: "each", supplier: "" }]); }
  function updateMaterial(i: number, field: string, value: string | number) { const u = [...materials]; (u[i] as Record<string, unknown>)[field] = value; setMaterials(u); }
  function removeMaterial(i: number) { setMaterials(materials.filter((_, idx) => idx !== i)); }

  // Sub helpers
  function addSub() { setSubs([...subs, { company_name: "", trade: "", worker_count: 0, work_description: "" }]); }
  function updateSub(i: number, field: string, value: string | number) { const u = [...subs]; (u[i] as Record<string, unknown>)[field] = value; setSubs(u); }
  function removeSub(i: number) { setSubs(subs.filter((_, idx) => idx !== i)); }

  // Photo helpers
  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    const newPhotos: PhotoItem[] = [];
    for (let i = 0; i < files.length && photos.length + newPhotos.length < 10; i++) {
      const file = files[i];
      newPhotos.push({
        file,
        preview: URL.createObjectURL(file),
        caption: "",
        uploading: false,
        uploaded: false,
      });
    }
    setPhotos([...photos, ...newPhotos]);
    e.target.value = "";
  }

  function updatePhotoCaption(i: number, caption: string) {
    const u = [...photos];
    u[i].caption = caption;
    setPhotos(u);
  }

  function removePhoto(i: number) {
    URL.revokeObjectURL(photos[i].preview);
    setPhotos(photos.filter((_, idx) => idx !== i));
  }

  async function handleSubmit() {
    if (!employeeId || !pin) {
      setError(t("error.idPinRequired"));
      setCurrentSection(0);
      return;
    }

    setLoading(true);
    setError("");

    // Capture GPS
    let gpsLat: number | null = null;
    let gpsLng: number | null = null;
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
      });
      gpsLat = pos.coords.latitude;
      gpsLng = pos.coords.longitude;
    } catch { /* GPS not available */ }

    try {
      // Submit the report first
      const res = await fetch("/time/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employee_id: employeeId,
          pin: pin,
          report: {
            report_date: reportDate,
            project_name: projectName,
            project_number: projectNumber,
            site_address: siteAddress,
            foreman_id: foremanId || null,
            weather_conditions: weather,
            temperature_range: tempRange,
            weather_impacted_work: weatherImpact,
            weather_impact_notes: weatherNotes,
            work_description: workDescription,
            work_type: workTypes,
            phase_of_work: phaseOfWork,
            percent_complete: percentComplete,
            delays_encountered: delays,
            delay_notes: delayNotes,
            extra_work_ordered: extraWork,
            extra_work_notes: extraWorkNotes,
            safety_briefing_held: safetyBriefing,
            ppe_compliant: ppeCompliant,
            incidents_occurred: incidents,
            incident_description: incidentDesc,
            incident_reported_to: incidentReportedTo,
            near_misses: nearMisses,
            near_miss_notes: nearMissNotes,
            hazards_identified: hazards,
            visitors_on_site: visitors,
            additional_notes: additionalNotes,
            foreman_confirmed: foremanConfirmed,
            gps_lat: gpsLat,
            gps_lng: gpsLng,
            crew: crew.filter((c) => c.employee_id),
            equipment: equipment.filter((e) => e.equipment_name),
            materials: materials.filter((m) => m.material_description),
            subcontractors: subs.filter((s) => s.company_name),
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t("error.submitFailed"));
        setLoading(false);
        return;
      }

      const reportId = data.report_id;

      // Upload photos if any
      const photosToUpload = photos.filter((p) => !p.uploaded);
      for (const photo of photosToUpload) {
        const formData = new FormData();
        formData.append("file", photo.file);
        formData.append("report_id", reportId);
        formData.append("caption", photo.caption);
        formData.append("employee_id", employeeId);
        formData.append("pin", pin);

        await fetch("/time/api/upload", {
          method: "POST",
          body: formData,
        });
      }

      router.push(
        `/time/report/confirmation?name=${encodeURIComponent(data.employee_name)}&date=${reportDate}&project=${encodeURIComponent(projectName)}`
      );
    } catch {
      setError(t("error.submitFailed"));
      setLoading(false);
    }
  }

  const inputClass = "w-full p-3 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none";
  const labelClass = "block text-sm text-gray-300 mb-1";
  const btnClass = "px-4 py-2 rounded font-medium transition-colors";

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <LanguageToggle />
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-2xl font-bold text-center mb-2">{t("report.title")}</h1>

        {/* Progress bar */}
        <div className="flex gap-1 mb-6">
          {sections.map((s, i) => (
            <button
              key={s}
              onClick={() => setCurrentSection(i)}
              className={`flex-1 h-2 rounded ${i <= currentSection ? "bg-blue-500" : "bg-gray-700"}`}
              title={s}
            />
          ))}
        </div>

        <p className="text-center text-sm text-gray-400 mb-4">
          {sections[currentSection]} ({currentSection + 1}/{sections.length})
        </p>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-300 p-3 rounded mb-4">{error}</div>
        )}

        {/* Section 0: Auth */}
        {currentSection === 0 && (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>{t("app.employeeId")}</label>
              <input className={inputClass} value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} placeholder="e.g. 001" />
            </div>
            <div>
              <label className={labelClass}>{t("app.pin")}</label>
              <input className={inputClass} type="password" value={pin} onChange={(e) => setPin(e.target.value)} placeholder="****" />
            </div>
          </div>
        )}

        {/* Section 1: Job Site */}
        {currentSection === 1 && (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>{t("field.reportDate")}</label>
              <input className={inputClass} type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>{t("field.projectName")} *</label>
              <input className={inputClass} value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="e.g. Main St Office Build" />
            </div>
            <div>
              <label className={labelClass}>{t("field.projectNumber")}</label>
              <input className={inputClass} value={projectNumber} onChange={(e) => setProjectNumber(e.target.value)} placeholder={t("field.optional")} />
            </div>
            <div>
              <label className={labelClass}>{t("field.siteAddress")}</label>
              <input className={inputClass} value={siteAddress} onChange={(e) => setSiteAddress(e.target.value)} placeholder="123 Main St" />
            </div>
            <div>
              <label className={labelClass}>{t("field.foreman")}</label>
              <select className={inputClass} value={foremanId} onChange={(e) => setForemanId(e.target.value)}>
                <option value="">{t("field.select")}</option>
                {employees.filter((e) => e.role === "manager" || e.role === "super_admin").map((e) => (
                  <option key={e.id} value={e.id}>{e.name} ({e.employee_id})</option>
                ))}
                {employees.filter((e) => e.role === "worker").map((e) => (
                  <option key={e.id} value={e.id}>{e.name} ({e.employee_id})</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{t("field.weather")}</label>
              <div className="flex flex-wrap gap-2">
                {WEATHER_OPTIONS.map((w) => (
                  <button key={w} onClick={() => setWeather(w)} className={`px-3 py-1.5 rounded text-sm ${weather === w ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"}`}>{w}</button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>{t("field.temperature")}</label>
              <div className="flex flex-wrap gap-2">
                {TEMP_RANGES.map((tr) => (
                  <button key={tr} onClick={() => setTempRange(tr)} className={`px-3 py-1.5 rounded text-sm ${tempRange === tr ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"}`}>{tr}</button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="weatherImpact" checked={weatherImpact} onChange={(e) => setWeatherImpact(e.target.checked)} className="w-5 h-5" />
              <label htmlFor="weatherImpact" className="text-gray-300">{t("field.weatherImpact")}</label>
            </div>
            {weatherImpact && (
              <textarea className={inputClass} value={weatherNotes} onChange={(e) => setWeatherNotes(e.target.value)} placeholder={t("field.weatherNotes")} rows={2} />
            )}
          </div>
        )}

        {/* Section 2: Crew */}
        {currentSection === 2 && (
          <div className="space-y-4">
            {crew.map((c, i) => (
              <div key={i} className="bg-gray-800 p-3 rounded space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">{t("crew.member")} {i + 1}</span>
                  <button onClick={() => removeCrew(i)} className="text-red-400 text-sm hover:text-red-300">{t("crew.remove")}</button>
                </div>
                <select className={inputClass} value={c.employee_id} onChange={(e) => updateCrew(i, "employee_id", e.target.value)}>
                  <option value="">{t("crew.selectEmployee")}</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.employee_id})</option>
                  ))}
                </select>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-gray-400">{t("crew.regHours")}</label>
                    <input className={inputClass} type="number" step="0.5" value={c.hours_regular} onChange={(e) => updateCrew(i, "hours_regular", parseFloat(e.target.value) || 0)} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">{t("crew.otHours")}</label>
                    <input className={inputClass} type="number" step="0.5" value={c.hours_overtime} onChange={(e) => updateCrew(i, "hours_overtime", parseFloat(e.target.value) || 0)} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">{t("crew.role")}</label>
                    <input className={inputClass} value={c.role_on_site} onChange={(e) => updateCrew(i, "role_on_site", e.target.value)} placeholder="Laborer" />
                  </div>
                </div>
              </div>
            ))}
            <button onClick={addCrewRow} className={`${btnClass} bg-blue-600 hover:bg-blue-700 w-full`}>{t("crew.add")}</button>
          </div>
        )}

        {/* Section 3: Work */}
        {currentSection === 3 && (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>{t("work.description")} *</label>
              <textarea className={inputClass} value={workDescription} onChange={(e) => setWorkDescription(e.target.value)} placeholder={t("work.descPlaceholder")} rows={4} />
            </div>
            <div>
              <label className={labelClass}>{t("work.type")}</label>
              <div className="flex flex-wrap gap-2">
                {WORK_TYPES.map((wt) => (
                  <button key={wt} onClick={() => toggleWorkType(wt)} className={`px-3 py-1.5 rounded text-sm ${workTypes.includes(wt) ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"}`}>{wt}</button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>{t("work.phase")}</label>
              <input className={inputClass} value={phaseOfWork} onChange={(e) => setPhaseOfWork(e.target.value)} placeholder={t("work.phasePlaceholder")} />
            </div>
            <div>
              <label className={labelClass}>{t("work.percentComplete")}: {percentComplete}%</label>
              <input type="range" min="0" max="100" step="5" value={percentComplete} onChange={(e) => setPercentComplete(parseInt(e.target.value))} className="w-full" />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={delays} onChange={(e) => setDelays(e.target.checked)} className="w-5 h-5" />
              <span className="text-gray-300">{t("work.delays")}</span>
            </div>
            {delays && <textarea className={inputClass} value={delayNotes} onChange={(e) => setDelayNotes(e.target.value)} placeholder={t("work.delayNotes")} rows={2} />}
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={extraWork} onChange={(e) => setExtraWork(e.target.checked)} className="w-5 h-5" />
              <span className="text-gray-300">{t("work.extraWork")}</span>
            </div>
            {extraWork && <textarea className={inputClass} value={extraWorkNotes} onChange={(e) => setExtraWorkNotes(e.target.value)} placeholder={t("work.extraNotes")} rows={2} />}
          </div>
        )}

        {/* Section 4: Equipment */}
        {currentSection === 4 && (
          <div className="space-y-4">
            {equipment.map((eq, i) => (
              <div key={i} className="bg-gray-800 p-3 rounded space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">{t("equip.item")} {i + 1}</span>
                  <button onClick={() => removeEquipment(i)} className="text-red-400 text-sm hover:text-red-300">{t("crew.remove")}</button>
                </div>
                <input className={inputClass} value={eq.equipment_name} onChange={(e) => updateEquipment(i, "equipment_name", e.target.value)} placeholder={t("equip.name")} />
                <div className="grid grid-cols-2 gap-2">
                  <input className={inputClass} value={eq.equipment_id_number} onChange={(e) => updateEquipment(i, "equipment_id_number", e.target.value)} placeholder={t("equip.id")} />
                  <input className={inputClass} type="number" step="0.5" value={eq.hours_used} onChange={(e) => updateEquipment(i, "hours_used", parseFloat(e.target.value) || 0)} placeholder={t("equip.hours")} />
                </div>
                <input className={inputClass} value={eq.operator_name} onChange={(e) => updateEquipment(i, "operator_name", e.target.value)} placeholder={t("equip.operator")} />
                <input className={inputClass} value={eq.equipment_issues} onChange={(e) => updateEquipment(i, "equipment_issues", e.target.value)} placeholder={t("equip.issues")} />
              </div>
            ))}
            <button onClick={addEquipment} className={`${btnClass} bg-blue-600 hover:bg-blue-700 w-full`}>{t("equip.add")}</button>
          </div>
        )}

        {/* Section 5: Materials */}
        {currentSection === 5 && (
          <div className="space-y-4">
            {materials.map((m, i) => (
              <div key={i} className="bg-gray-800 p-3 rounded space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">{t("mat.item")} {i + 1}</span>
                  <button onClick={() => removeMaterial(i)} className="text-red-400 text-sm hover:text-red-300">{t("crew.remove")}</button>
                </div>
                <input className={inputClass} value={m.material_description} onChange={(e) => updateMaterial(i, "material_description", e.target.value)} placeholder={t("mat.description")} />
                <div className="grid grid-cols-3 gap-2">
                  <input className={inputClass} type="number" step="0.01" value={m.quantity} onChange={(e) => updateMaterial(i, "quantity", parseFloat(e.target.value) || 0)} placeholder={t("mat.qty")} />
                  <select className={inputClass} value={m.unit} onChange={(e) => updateMaterial(i, "unit", e.target.value)}>
                    {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <input className={inputClass} value={m.supplier} onChange={(e) => updateMaterial(i, "supplier", e.target.value)} placeholder={t("mat.supplier")} />
                </div>
              </div>
            ))}
            <button onClick={addMaterial} className={`${btnClass} bg-blue-600 hover:bg-blue-700 w-full`}>{t("mat.add")}</button>
          </div>
        )}

        {/* Section 6: Safety */}
        {currentSection === 6 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input type="checkbox" id="safety" checked={safetyBriefing} onChange={(e) => setSafetyBriefing(e.target.checked)} className="w-5 h-5" />
              <label htmlFor="safety" className="text-gray-300">{t("safety.briefing")}</label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" id="ppe" checked={ppeCompliant} onChange={(e) => setPpeCompliant(e.target.checked)} className="w-5 h-5" />
              <label htmlFor="ppe" className="text-gray-300">{t("safety.ppe")}</label>
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={incidents} onChange={(e) => setIncidents(e.target.checked)} className="w-5 h-5" />
              <span className="text-gray-300">{t("safety.incidents")}</span>
            </div>
            {incidents && (
              <>
                <textarea className={inputClass} value={incidentDesc} onChange={(e) => setIncidentDesc(e.target.value)} placeholder={t("safety.incidentDesc")} rows={3} />
                <input className={inputClass} value={incidentReportedTo} onChange={(e) => setIncidentReportedTo(e.target.value)} placeholder={t("safety.reportedTo")} />
              </>
            )}
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={nearMisses} onChange={(e) => setNearMisses(e.target.checked)} className="w-5 h-5" />
              <span className="text-gray-300">{t("safety.nearMisses")}</span>
            </div>
            {nearMisses && <textarea className={inputClass} value={nearMissNotes} onChange={(e) => setNearMissNotes(e.target.value)} placeholder={t("safety.nearMissNotes")} rows={2} />}
            <div>
              <label className={labelClass}>{t("safety.hazards")}</label>
              <textarea className={inputClass} value={hazards} onChange={(e) => setHazards(e.target.value)} placeholder={t("safety.hazardsPlaceholder")} rows={2} />
            </div>
            <div>
              <label className={labelClass}>{t("safety.visitors")}</label>
              <input className={inputClass} value={visitors} onChange={(e) => setVisitors(e.target.value)} placeholder={t("safety.visitorsPlaceholder")} />
            </div>
          </div>
        )}

        {/* Section 7: Subcontractors */}
        {currentSection === 7 && (
          <div className="space-y-4">
            {subs.map((s, i) => (
              <div key={i} className="bg-gray-800 p-3 rounded space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-400">{t("sub.item")} {i + 1}</span>
                  <button onClick={() => removeSub(i)} className="text-red-400 text-sm hover:text-red-300">{t("crew.remove")}</button>
                </div>
                <input className={inputClass} value={s.company_name} onChange={(e) => updateSub(i, "company_name", e.target.value)} placeholder={t("sub.company")} />
                <div className="grid grid-cols-2 gap-2">
                  <input className={inputClass} value={s.trade} onChange={(e) => updateSub(i, "trade", e.target.value)} placeholder={t("sub.trade")} />
                  <input className={inputClass} type="number" value={s.worker_count} onChange={(e) => updateSub(i, "worker_count", parseInt(e.target.value) || 0)} placeholder={t("sub.workers")} />
                </div>
                <input className={inputClass} value={s.work_description} onChange={(e) => updateSub(i, "work_description", e.target.value)} placeholder={t("sub.workDesc")} />
              </div>
            ))}
            <button onClick={addSub} className={`${btnClass} bg-blue-600 hover:bg-blue-700 w-full`}>{t("sub.add")}</button>
          </div>
        )}

        {/* Section 8: Photos */}
        {currentSection === 8 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">{t("photos.max")}</p>

            {photos.map((p, i) => (
              <div key={i} className="bg-gray-800 p-3 rounded space-y-2">
                <div className="flex gap-3">
                  <img src={p.preview} alt={`Photo ${i + 1}`} className="w-20 h-20 object-cover rounded" />
                  <div className="flex-1">
                    <input
                      className={inputClass}
                      value={p.caption}
                      onChange={(e) => updatePhotoCaption(i, e.target.value)}
                      placeholder={t("photos.caption")}
                    />
                    <button onClick={() => removePhoto(i)} className="text-red-400 text-sm hover:text-red-300 mt-1">
                      {t("photos.remove")}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {photos.length < 10 && (
              <label className="block w-full py-8 border-2 border-dashed border-gray-600 rounded-lg text-center cursor-pointer hover:border-blue-500 transition-colors">
                <div className="text-3xl mb-2">📷</div>
                <p className="text-gray-400">{t("photos.tap")}</p>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic"
                  multiple
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>
        )}

        {/* Section 9: Notes & Sign-Off */}
        {currentSection === 9 && (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>{t("notes.additional")}</label>
              <textarea className={inputClass} value={additionalNotes} onChange={(e) => setAdditionalNotes(e.target.value)} placeholder={t("notes.placeholder")} rows={4} />
            </div>
            <div className="bg-yellow-900/30 border border-yellow-600 p-4 rounded">
              <div className="flex items-center gap-3">
                <input type="checkbox" id="confirm" checked={foremanConfirmed} onChange={(e) => setForemanConfirmed(e.target.checked)} className="w-6 h-6" />
                <label htmlFor="confirm" className="text-yellow-200 font-medium">{t("notes.confirm")}</label>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-6">
          {currentSection > 0 && (
            <button onClick={() => setCurrentSection(currentSection - 1)} className={`${btnClass} bg-gray-700 hover:bg-gray-600 flex-1`}>
              {t("btn.back")}
            </button>
          )}
          {currentSection < sections.length - 1 ? (
            <button onClick={() => setCurrentSection(currentSection + 1)} className={`${btnClass} bg-blue-600 hover:bg-blue-700 flex-1`}>
              {t("btn.next")}
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading} className={`${btnClass} bg-green-600 hover:bg-green-700 flex-1 disabled:opacity-50`}>
              {loading ? t("btn.submitting") : t("btn.submit")}
            </button>
          )}
        </div>

        <div className="text-center mt-6">
          <a href="/time" className="text-gray-500 hover:text-gray-300 text-sm">{t("app.backToClock")}</a>
        </div>
      </div>
    </div>
  );
}
