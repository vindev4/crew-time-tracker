import { NextRequest, NextResponse } from "next/server";
import { signAdminToken } from "@/lib/auth";

// Admin login - simple env var based auth
export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const adminUser = process.env.ADMIN_USERNAME || "admin";
    const adminPass = process.env.ADMIN_PASSWORD || "duraport2026";

    if (username !== adminUser || password !== adminPass) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const token = signAdminToken({
      id: "admin-001",
      username: adminUser,
      role: "super_admin",
    });

    const response = NextResponse.json({
      success: true,
      admin: { id: "admin-001", username: adminUser, role: "super_admin" },
    });

    response.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 8 * 60 * 60,
      path: "/",
    });

    // Also set admin_authenticated for legacy API routes
    response.cookies.set("admin_authenticated", "true", {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 8 * 60 * 60,
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Admin logout
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("admin_token");
  response.cookies.delete("admin_authenticated");
  return response;
}
