import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAdminFromCookies } from "@/lib/auth";

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  const admin = await getAdminFromCookies();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceSupabase();
  const url = req.nextUrl;

  // Filter params
  const startDate = url.searchParams.get("start");
  const endDate = url.searchParams.get("end");
  const employeeIds = url.searchParams.get("employees"); // comma-separated UUIDs
  const locations = url.searchParams.get("locations"); // comma-separated strings
  const sortCol = url.searchParams.get("sort") || "submitted_at";
  const sortDir = url.searchParams.get("dir") === "asc" ? true : false; // true = ascending
  const overtimeOnly = url.searchParams.get("overtime") === "true";

  // Build query
  let query = supabase
    .from("daily_reports")
    .select("*, employees!inner(name, employee_id)")
    .order(sortCol, { ascending: sortDir });

  if (startDate) {
    query = query.gte("report_date", startDate);
  }
  if (endDate) {
    query = query.lte("report_date", endDate);
  }
  if (employeeIds) {
    const ids = employeeIds.split(",").filter(Boolean);
    if (ids.length > 0) {
      query = query.in("employee_id", ids);
    }
  }
  if (locations) {
    const locs = locations.split(",").filter(Boolean);
    if (locs.length > 0) {
      query = query.in("job_location", locs);
    }
  }

  const { data: reports, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Flatten employee info
  const flatReports = (reports || []).map((r: any) => ({
    id: r.id,
    employee_id: r.employee_id,
    employee_name: r.employees?.name || "",
    employee_custom_id: r.employees?.employee_id || "",
    report_date: r.report_date,
    start_time: r.start_time,
    stop_time: r.stop_time,
    job_location: r.job_location,
    hours_worked: r.hours_worked,
    notes: r.notes,
    submitted_at: r.submitted_at,
  }));

  // Overtime calculation: for each employee in results, compute weekly hours
  // Get unique employee IDs in results
  const uniqueEmpIds = Array.from(new Set(flatReports.map((r: any) => r.employee_id)));

  // Determine date range needed for full week coverage
  // Find min/max dates in results, extend to cover full Mon-Sun weeks
  let overtimeMap: Record<string, Record<string, number>> = {}; // empId -> weekKey -> totalHours

  if (uniqueEmpIds.length > 0) {
    // Get all dates in result set
    const allDates = flatReports.map((r: any) => r.report_date).filter(Boolean);
    if (allDates.length > 0) {
      const minDate = new Date(allDates.sort()[0]);
      const maxDate = new Date(allDates.sort()[allDates.length - 1]);

      // Extend to cover full weeks (Monday start)
      const minDay = minDate.getDay();
      const mondayOffset = minDay === 0 ? 6 : minDay - 1;
      const weekStart = new Date(minDate);
      weekStart.setDate(weekStart.getDate() - mondayOffset);

      const maxDay = maxDate.getDay();
      const sundayOffset = maxDay === 0 ? 0 : 7 - maxDay;
      const weekEnd = new Date(maxDate);
      weekEnd.setDate(weekEnd.getDate() + sundayOffset);

      const wsStr = weekStart.toISOString().split("T")[0];
      const weStr = weekEnd.toISOString().split("T")[0];

      // Fetch ALL reports for these employees in the full week range
      const { data: weekData } = await supabase
        .from("daily_reports")
        .select("employee_id, report_date, hours_worked")
        .in("employee_id", uniqueEmpIds as string[])
        .gte("report_date", wsStr)
        .lte("report_date", weStr);

      if (weekData) {
        for (const row of weekData) {
          const d = new Date(row.report_date);
          const day = d.getDay();
          const monOff = day === 0 ? 6 : day - 1;
          const monday = new Date(d);
          monday.setDate(monday.getDate() - monOff);
          const weekKey = monday.toISOString().split("T")[0];

          if (!overtimeMap[row.employee_id]) overtimeMap[row.employee_id] = {};
          if (!overtimeMap[row.employee_id][weekKey]) overtimeMap[row.employee_id][weekKey] = 0;
          overtimeMap[row.employee_id][weekKey] += row.hours_worked || 0;
        }
      }
    }
  }

  // Annotate reports with overtime info
  const annotated = flatReports.map((r: any) => {
    const d = new Date(r.report_date);
    const day = d.getDay();
    const monOff = day === 0 ? 6 : day - 1;
    const monday = new Date(d);
    monday.setDate(monday.getDate() - monOff);
    const weekKey = monday.toISOString().split("T")[0];
    const weekTotal = overtimeMap[r.employee_id]?.[weekKey] || 0;
    return {
      ...r,
      week_total_hours: Math.round(weekTotal * 100) / 100,
      is_overtime: weekTotal > 40,
    };
  });

  // If overtime-only filter, remove non-overtime rows
  const finalReports = overtimeOnly ? annotated.filter((r: any) => r.is_overtime) : annotated;

  // Also fetch distinct employees and locations for filter dropdowns
  const { data: allEmployees } = await supabase
    .from("employees")
    .select("id, name, employee_id")
    .eq("active", true)
    .order("name", { ascending: true });

  const { data: allLocations } = await supabase
    .from("daily_reports")
    .select("job_location")
    .not("job_location", "is", null);

  const uniqueLocations = Array.from(new Set((allLocations || []).map((l: any) => l.job_location).filter(Boolean))).sort();

  return NextResponse.json({
    reports: finalReports,
    employees: allEmployees || [],
    locations: uniqueLocations,
  });
}

export async function PATCH(req: NextRequest) {
  const admin = await getAdminFromCookies();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceSupabase();
  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing report id" }, { status: 400 });
  }

  const { error } = await supabase
    .from("daily_reports")
    .update(updates)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
