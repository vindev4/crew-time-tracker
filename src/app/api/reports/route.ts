import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const employeeId = cookieStore.get("employee_id")?.value;
    if (!employeeId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await request.json();
    const report_date = body.report_date || body.date;
    const { start_time, stop_time, job_location, notes, hours_worked } = body;

    if (!report_date || !start_time || !stop_time || !job_location) {
      console.error("Validation failed:", { report_date, start_time, stop_time, job_location, bodyKeys: Object.keys(body) });
      return NextResponse.json({ error: "Date, start time, stop time, and job location are required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("daily_reports")
      .insert({
        employee_id: employeeId,
        report_date,
        start_time,
        stop_time,
        job_location,
        notes: notes || "",
        hours_worked: hours_worked || 0,
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Report insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, report: data });
  } catch (err) {
    console.error("Reports API error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const cookieStore = cookies();
    const employeeId = cookieStore.get("employee_id")?.value;
    if (!employeeId) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const { data, error } = await supabase
      .from("daily_reports")
      .select("id, report_date, start_time, stop_time, job_location, notes, hours_worked, submitted_at")
      .eq("employee_id", employeeId)
      .order("report_date", { ascending: false })
      .limit(30);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ reports: data });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
