import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { getAdminFromCookies } from "@/lib/auth";

// GET — admin fetch all reports with filters
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("start");
    const endDate = searchParams.get("end");
    const reportId = searchParams.get("id");
    const format = searchParams.get("format"); // "payroll" for weekly summary

    const supabase = getServiceSupabase();

    // Single report detail view
    if (reportId) {
      const { data: report } = await supabase
        .from("daily_reports")
        .select("*, employees!daily_reports_employee_id_fkey(employee_id, name)")
        .eq("id", reportId)
        .single();

      if (!report) {
        return NextResponse.json({ error: "Report not found" }, { status: 404 });
      }

      const [crew, equipment, materials, subs, photos] = await Promise.all([
        supabase.from("report_crew").select("*, employees(employee_id, name)").eq("report_id", reportId),
        supabase.from("report_equipment").select("*").eq("report_id", reportId),
        supabase.from("report_materials").select("*").eq("report_id", reportId),
        supabase.from("report_subcontractors").select("*").eq("report_id", reportId),
        supabase.from("report_photos").select("*").eq("report_id", reportId),
      ]);

      return NextResponse.json({
        report,
        crew: crew.data || [],
        equipment: equipment.data || [],
        materials: materials.data || [],
        subcontractors: subs.data || [],
        photos: photos.data || [],
      });
    }

    // Payroll summary format - aggregated hours per employee
    if (format === "payroll") {
      let query = supabase
        .from("report_crew")
        .select("employee_id, hours_regular, hours_overtime, employees(employee_id, name), daily_reports!inner(report_date, project_name, site_address)")
        .order("employee_id");

      // We need to filter by report date via the daily_reports join
      if (startDate) query = query.gte("daily_reports.report_date", startDate);
      if (endDate) query = query.lte("daily_reports.report_date", endDate);

      const { data: crewData, error } = await query;

      if (error) {
        return NextResponse.json({ error: "Failed to fetch payroll data", details: error }, { status: 500 });
      }

      return NextResponse.json({ payroll: crewData || [] });
    }

    // List all reports with crew hours included
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

    // Fetch crew data for all reports to show hours summary
    const reportIds = (reports || []).map((r: { id: string }) => r.id);
    let crewByReport: Record<string, Array<{ employee_id: string; hours_regular: number; hours_overtime: number; employees: { employee_id: string; name: string } }>> = {};

    if (reportIds.length > 0) {
      const { data: allCrew } = await supabase
        .from("report_crew")
        .select("*, employees(employee_id, name)")
        .in("report_id", reportIds);

      if (allCrew) {
        for (const c of allCrew) {
          if (!crewByReport[c.report_id]) crewByReport[c.report_id] = [];
          crewByReport[c.report_id].push(c);
        }
      }
    }

    return NextResponse.json({
      reports: reports || [],
      crewByReport,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}