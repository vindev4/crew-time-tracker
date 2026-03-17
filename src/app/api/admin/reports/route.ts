import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function isAdmin() {
  const cookieStore = cookies();
  return cookieStore.get("admin_authenticated")?.value === "true";
}

export async function GET(request: NextRequest) {
  if (!isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get("start");
  const endDate = searchParams.get("end");
  const employeeId = searchParams.get("employee_id");

  let query = supabase
    .from("daily_reports")
    .select("id, employee_id, report_date, start_time, stop_time, job_location, hours_worked, notes, submitted_at, created_at")
    .order("submitted_at", { ascending: false });

  if (startDate) query = query.gte("report_date", startDate);
  if (endDate) query = query.lte("report_date", endDate);
  if (employeeId) query = query.eq("employee_id", employeeId);

  const { data: reports, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get employee names
  const empIds = Array.from(new Set((reports || []).map((r) => r.employee_id)));
  let employeeMap: Record<string, string> = {};
  if (empIds.length > 0) {
    const { data: emps } = await supabase
      .from("employees")
      .select("id, employee_id, name")
      .in("id", empIds);
    if (emps) {
      employeeMap = Object.fromEntries(emps.map((e) => [e.id, e.name]));
    }
  }

  const enriched = (reports || []).map((r) => ({
    ...r,
    employee_name: employeeMap[r.employee_id] || "Unknown",
  }));

  return NextResponse.json({ reports: enriched });
}

export async function PATCH(request: NextRequest) {
  if (!isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id, start_time, stop_time, job_location, hours_worked, notes } = await request.json();
    if (!id) return NextResponse.json({ error: "Report id required" }, { status: 400 });

    const updates: Record<string, unknown> = {};
    if (start_time !== undefined) updates.start_time = start_time;
    if (stop_time !== undefined) updates.stop_time = stop_time;
    if (job_location !== undefined) updates.job_location = job_location;
    if (hours_worked !== undefined) updates.hours_worked = hours_worked;
    if (notes !== undefined) updates.notes = notes;

    const { error } = await supabase.from("daily_reports").update(updates).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await request.json();
    if (!id) return NextResponse.json({ error: "Report id required" }, { status: 400 });
    const { error } = await supabase.from("daily_reports").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
