import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { getAdminFromCookies } from "@/lib/auth";

// Export punches as CSV
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");

    const supabase = getServiceSupabase();

    let query = supabase
      .from("punches")
      .select(
        `
        *,
        employees!inner(employee_id, name)
      `
      )
      .order("timestamp", { ascending: true });

    if (startDate) {
      query = query.gte("timestamp", startDate);
    }
    if (endDate) {
      query = query.lte("timestamp", endDate + "T23:59:59");
    }

    const { data: punches, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch punches" },
        { status: 500 }
      );
    }

    // Build CSV
    const headers = [
      "Employee ID",
      "Name",
      "Type",
      "Timestamp",
      "Latitude",
      "Longitude",
      "GPS Available",
    ];
    const rows = (punches || []).map((p: Record<string, unknown>) => {
      const emp = p.employees as Record<string, unknown>;
      return [
        emp.employee_id,
        emp.name,
        p.type === "clock_in" ? "Clock In" : "Clock Out",
        new Date(p.timestamp as string).toLocaleString(),
        p.lat || "",
        p.lng || "",
        p.gps_available ? "Yes" : "No",
      ].join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="time-report-${startDate || "all"}-to-${endDate || "now"}.csv"`,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
