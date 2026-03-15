import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { getAdminFromCookies } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("start");
    const endDate = searchParams.get("end");

    const supabase = getServiceSupabase();

    let query = supabase
      .from("daily_reports")
      .select("*, employees!daily_reports_employee_id_fkey(employee_id, name)")
      .order("report_date", { ascending: false });

    if (startDate) query = query.gte("report_date", startDate);
    if (endDate) query = query.lte("report_date", endDate);

    const { data: reports, error } = await query;

    if (error) {
      return NextResponse.json({ error: "Failed to fetch reports" }, { status: 500 });
    }

    // Dynamically import ExcelJS
    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "DuraPort Crew Time Tracker";
    workbook.created = new Date();

    // Main reports sheet
    const ws = workbook.addWorksheet("Daily Reports");

    // Header row
    ws.columns = [
      { header: "Date", key: "date", width: 12 },
      { header: "Employee ID", key: "emp_id", width: 12 },
      { header: "Employee Name", key: "emp_name", width: 20 },
      { header: "Project Name", key: "project", width: 25 },
      { header: "Project #", key: "project_num", width: 12 },
      { header: "Site Address", key: "address", width: 25 },
      { header: "Weather", key: "weather", width: 12 },
      { header: "Temp", key: "temp", width: 10 },
      { header: "Work Types", key: "work_types", width: 25 },
      { header: "Work Description", key: "work_desc", width: 40 },
      { header: "Phase", key: "phase", width: 20 },
      { header: "% Complete", key: "pct", width: 12 },
      { header: "Delays", key: "delays", width: 8 },
      { header: "Delay Notes", key: "delay_notes", width: 25 },
      { header: "Safety Briefing", key: "safety", width: 14 },
      { header: "PPE Compliant", key: "ppe", width: 13 },
      { header: "Incidents", key: "incidents", width: 10 },
      { header: "Foreman Confirmed", key: "confirmed", width: 16 },
      { header: "Notes", key: "notes", width: 30 },
    ];

    // Style header
    ws.getRow(1).font = { bold: true };
    ws.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF2563EB" },
    };
    ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

    // Data rows
    interface ReportRow {
      report_date: string;
      project_name: string;
      project_number: string;
      site_address: string;
      weather_conditions: string;
      temperature_range: string;
      work_type: string[];
      work_description: string;
      phase_of_work: string;
      percent_complete: number;
      delays_encountered: boolean;
      delay_notes: string;
      safety_briefing_held: boolean;
      ppe_compliant: boolean;
      incidents_occurred: boolean;
      foreman_confirmed: boolean;
      additional_notes: string;
      employees: { employee_id: string; name: string };
    }

    for (const r of (reports || []) as ReportRow[]) {
      ws.addRow({
        date: r.report_date,
        emp_id: r.employees?.employee_id || "",
        emp_name: r.employees?.name || "",
        project: r.project_name,
        project_num: r.project_number,
        address: r.site_address,
        weather: r.weather_conditions,
        temp: r.temperature_range,
        work_types: (r.work_type || []).join(", "),
        work_desc: r.work_description,
        phase: r.phase_of_work,
        pct: r.percent_complete,
        delays: r.delays_encountered ? "Yes" : "No",
        delay_notes: r.delay_notes || "",
        safety: r.safety_briefing_held ? "Yes" : "No",
        ppe: r.ppe_compliant ? "Yes" : "No",
        incidents: r.incidents_occurred ? "Yes" : "No",
        confirmed: r.foreman_confirmed ? "Yes" : "No",
        notes: r.additional_notes || "",
      });
    }

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="field-reports-${startDate || "all"}-to-${endDate || "now"}.xlsx"`,
      },
    });
  } catch (err) {
    console.error("Export error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}