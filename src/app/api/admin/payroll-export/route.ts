import { NextRequest, NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { getAdminFromCookies } from "@/lib/auth";

// GET — export weekly payroll CSV
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("start");
    const endDate = searchParams.get("end");

    const supabase = getServiceSupabase();

    // Fetch all crew hours with report details for the date range
    let query = supabase
      .from("report_crew")
      .select("employee_id, hours_regular, hours_overtime, employees(employee_id, name), daily_reports!inner(report_date, project_name, site_address)")
      .order("employee_id");

    if (startDate) query = query.gte("daily_reports.report_date", startDate);
    if (endDate) query = query.lte("daily_reports.report_date", endDate);

    const { data: crewData, error } = await query;

    if (error) {
      return new NextResponse("Failed to fetch payroll data", { status: 500 });
    }

    // Aggregate hours per employee
    interface EmployeeHours {
      employeeId: string;
      name: string;
      totalRegular: number;
      totalOvertime: number;
      dailyDetails: Array<{ date: string; project: string; regular: number; overtime: number }>;
    }

    const employeeMap: Record<string, EmployeeHours> = {};

    for (const row of crewData || []) {
      const empData = row.employees as unknown as { employee_id: string; name: string };
      const reportData = row.daily_reports as unknown as { report_date: string; project_name: string; site_address: string };
      const key = row.employee_id;

      if (!employeeMap[key]) {
        employeeMap[key] = {
          employeeId: empData?.employee_id || "Unknown",
          name: empData?.name || "Unknown",
          totalRegular: 0,
          totalOvertime: 0,
          dailyDetails: [],
        };
      }

      employeeMap[key].totalRegular += row.hours_regular || 0;
      employeeMap[key].totalOvertime += row.hours_overtime || 0;
      employeeMap[key].dailyDetails.push({
        date: reportData?.report_date || "",
        project: reportData?.project_name || "",
        regular: row.hours_regular || 0,
        overtime: row.hours_overtime || 0,
      });
    }

    // Build CSV
    const dateRange = startDate && endDate ? `${startDate} to ${endDate}` : "All dates";
    let csv = "WEEKLY PAYROLL REPORT\n";
    csv += `Period: ${dateRange}\n`;
    csv += `Generated: ${new Date().toLocaleDateString()}\n\n`;
    csv += "Employee ID,Employee Name,Date,Project/Job,Regular Hours,Overtime Hours\n";

    const employees = Object.values(employeeMap).sort((a, b) => a.name.localeCompare(b.name));

    for (const emp of employees) {
      // Sort daily details by date
      emp.dailyDetails.sort((a, b) => a.date.localeCompare(b.date));
      for (const day of emp.dailyDetails) {
        csv += `${emp.employeeId},"${emp.name}",${day.date},"${day.project}",${day.regular},${day.overtime}\n`;
      }
      // Add subtotal row for this employee
      csv += `${emp.employeeId},"${emp.name} - TOTAL",,, ${emp.totalRegular},${emp.totalOvertime}\n`;
    }

    // Grand totals
    const grandRegular = employees.reduce((sum, e) => sum + e.totalRegular, 0);
    const grandOT = employees.reduce((sum, e) => sum + e.totalOvertime, 0);
    csv += `\n,GRAND TOTAL,,,${grandRegular},${grandOT}\n`;

    const filename = `payroll-${startDate || "all"}-to-${endDate || "all"}.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return new NextResponse("Internal server error", { status: 500 });
  }
}