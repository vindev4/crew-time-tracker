import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

// POST — submit a daily report
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { employee_id, pin, report } = body;

    const supabase = getServiceSupabase();

    // Authenticate worker
    const { data: emp } = await supabase
      .from("employees")
      .select("*")
      .eq("employee_id", employee_id)
      .eq("active", true)
      .single();

    if (!emp) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const bcrypt = await import("bcryptjs");
    const valid = await bcrypt.compare(pin, emp.pin_hash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Insert main report
    const { data: newReport, error: reportError } = await supabase
      .from("daily_reports")
      .insert({
        employee_id: emp.id,
        report_date: report.report_date,
        project_name: report.project_name,
        project_number: report.project_number,
        site_address: report.site_address,
        foreman_id: report.foreman_id || null,
        weather_conditions: report.weather_conditions,
        temperature_range: report.temperature_range,
        weather_impacted_work: report.weather_impacted_work,
        weather_impact_notes: report.weather_impact_notes,
        work_description: report.work_description,
        work_type: report.work_type,
        phase_of_work: report.phase_of_work,
        percent_complete: report.percent_complete,
        delays_encountered: report.delays_encountered,
        delay_notes: report.delay_notes,
        extra_work_ordered: report.extra_work_ordered,
        extra_work_notes: report.extra_work_notes,
        safety_briefing_held: report.safety_briefing_held,
        ppe_compliant: report.ppe_compliant,
        incidents_occurred: report.incidents_occurred,
        incident_description: report.incident_description,
        incident_reported_to: report.incident_reported_to,
        near_misses: report.near_misses,
        near_miss_notes: report.near_miss_notes,
        hazards_identified: report.hazards_identified,
        visitors_on_site: report.visitors_on_site,
        additional_notes: report.additional_notes,
        foreman_confirmed: report.foreman_confirmed,
        gps_lat: report.gps_lat,
        gps_lng: report.gps_lng,
      })
      .select()
      .single();

    if (reportError || !newReport) {
      return NextResponse.json({ error: "Failed to create report", details: reportError }, { status: 500 });
    }

    const reportId = newReport.id;

    // Insert crew rows
    if (report.crew && report.crew.length > 0) {
      const crewRows = report.crew.map((c: { employee_id: string; hours_regular: number; hours_overtime: number; role_on_site: string }) => ({
        report_id: reportId,
        employee_id: c.employee_id,
        hours_regular: c.hours_regular,
        hours_overtime: c.hours_overtime,
        role_on_site: c.role_on_site,
      }));
      await supabase.from("report_crew").insert(crewRows);
    }

    // Insert equipment rows
    if (report.equipment && report.equipment.length > 0) {
      const eqRows = report.equipment.map((e: { equipment_name: string; equipment_id_number: string; hours_used: number; operator_name: string; equipment_issues: string }) => ({
        report_id: reportId,
        equipment_name: e.equipment_name,
        equipment_id_number: e.equipment_id_number,
        hours_used: e.hours_used,
        operator_name: e.operator_name,
        equipment_issues: e.equipment_issues,
      }));
      await supabase.from("report_equipment").insert(eqRows);
    }

    // Insert materials rows
    if (report.materials && report.materials.length > 0) {
      const matRows = report.materials.map((m: { material_description: string; quantity: number; unit: string; supplier: string }) => ({
        report_id: reportId,
        material_description: m.material_description,
        quantity: m.quantity,
        unit: m.unit,
        supplier: m.supplier,
      }));
      await supabase.from("report_materials").insert(matRows);
    }

    // Insert subcontractor rows
    if (report.subcontractors && report.subcontractors.length > 0) {
      const subRows = report.subcontractors.map((s: { company_name: string; trade: string; worker_count: number; work_description: string }) => ({
        report_id: reportId,
        company_name: s.company_name,
        trade: s.trade,
        worker_count: s.worker_count,
        work_description: s.work_description,
      }));
      await supabase.from("report_subcontractors").insert(subRows);
    }

    return NextResponse.json({
      success: true,
      report_id: reportId,
      employee_name: emp.name,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET — fetch reports for a worker (by employee_id + pin query params)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employee_id");
    const pin = searchParams.get("pin");

    if (!employeeId || !pin) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    const { data: emp } = await supabase
      .from("employees")
      .select("*")
      .eq("employee_id", employeeId)
      .eq("active", true)
      .single();

    if (!emp) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const bcrypt = await import("bcryptjs");
    const valid = await bcrypt.compare(pin, emp.pin_hash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const { data: reports } = await supabase
      .from("daily_reports")
      .select("*")
      .eq("employee_id", emp.id)
      .order("report_date", { ascending: false })
      .limit(20);

    return NextResponse.json({ reports: reports || [] });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
