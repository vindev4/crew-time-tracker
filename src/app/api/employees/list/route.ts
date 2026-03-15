import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";

// GET — list active employees (for dropdowns in the report form)
export async function GET() {
  try {
    const supabase = getServiceSupabase();

    const { data: employees, error } = await supabase
      .from("employees")
      .select("id, employee_id, name, role")
      .eq("active", true)
      .order("name");

    if (error) {
      return NextResponse.json({ error: "Failed to fetch employees" }, { status: 500 });
    }

    return NextResponse.json({ employees: employees || [] });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
