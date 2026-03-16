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

export async function GET() {
  if (!isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: employees, error } = await supabase
    .from("employees")
    .select("id, employee_id, name, phone, role, active, created_at, pin_hash, approved")
    .order("employee_id");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const sanitized = (employees || []).map((e) => ({
    ...e,
    has_pin: !!e.pin_hash && e.pin_hash !== "$2a$10$placeholder",
    pin_hash: undefined,
  }));
  return NextResponse.json({ employees: sanitized });
}

export async function POST(request: NextRequest) {
  if (!isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { name, phone, employee_id } = await request.json();
    if (!name || !phone) return NextResponse.json({ error: "Name and phone are required" }, { status: 400 });
    let empId = employee_id;
    if (!empId) {
      const { data: maxEmp } = await supabase.from("employees").select("employee_id").order("employee_id", { ascending: false }).limit(1).single();
      const nextNum = maxEmp ? parseInt(maxEmp.employee_id) + 1 : 1;
      empId = String(nextNum).padStart(3, "0");
    }
    const { data, error } = await supabase
      .from("employees")
      .insert({ employee_id: empId, name, phone: phone.replace(/\D/g, ""), role: "worker", active: true, pin_hash: "$2a$10$placeholder" })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ employee: data });
  } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
}

export async function PATCH(request: NextRequest) {
  if (!isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { id, active, name, phone, reset_pin, approve } = await request.json();
    if (!id) return NextResponse.json({ error: "Employee id required" }, { status: 400 });
    const updates: Record<string, unknown> = {};
    if (typeof active === "boolean") updates.active = active;
    if (name) updates.name = name;
    if (phone) updates.phone = phone.replace(/\D/g, "");
    if (reset_pin) { updates.pin_hash = null; updates.approved = null; }
    if (typeof approve === "boolean") updates.approved = approve;
    const { error } = await supabase.from("employees").update(updates).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
}
