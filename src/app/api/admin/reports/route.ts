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

    const supabase = getServiceSupabase();

    // If requesting a single report with all details
    if (reportId) {
      const { data: report } = await supabase
        .from("daily_reports")
        .select("*, employees!daily_reports_employee_id_fkey(employee_id, name)")
        .eq("id", reportId)
        .single();

      if (!report) {
        return NextResponse.json({ error: "Report not found" }, { status: 404 });
      }

      // Fetch related data
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

    // List all reports
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

    return NextResponse.json({ reports: reports || [] });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
