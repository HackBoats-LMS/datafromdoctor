import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Case } from "@/lib/models";
import { getDoctorFromSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getDoctorFromSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const cases = await Case.find({})
      .populate("doctorId", "name email")
      .sort({ createdAt: -1 })
      .lean();

    // CSV Headers
    const headers = [
      "Case ID",
      "Status",
      "Version",
      "Symptoms",
      "Health Issues",
      "Others Causes",
      "Suggested Tablet",
      "Dosage Instructions",
      "Created At",
      "Physician Name",
      "Physician Email"
    ];

    // Format rows
    const rows = cases.map((c: any) => {
      const symptoms = Array.isArray(c.symptom) ? c.symptom.join("; ") : c.symptom || "";
      const healthIssues = Array.isArray(c.healthIssues) ? c.healthIssues.join("; ") : "";
      const othersCauses = Array.isArray(c.othersCauses) ? c.othersCauses.join("; ") : c.othersCauses || "";
      
      let suggestedTablets = "";
      let dosageNotes = "";

      if (c.prescriptions && c.prescriptions.length > 0) {
        suggestedTablets = c.prescriptions.map((p: any) => p.tablet).join("; ");
        dosageNotes = c.prescriptions.map((p: any) => p.dosage || "N/A").join("; ");
      } else {
        suggestedTablets = c.suggestedTablet || "";
        dosageNotes = c.dosageNotes || "";
      }

      return [
        c._id?.toString() || "",
        c.status || "active",
        c.version?.toString() || "1",
        symptoms,
        healthIssues,
        othersCauses,
        suggestedTablets,
        dosageNotes,
        c.createdAt ? new Date(c.createdAt).toISOString() : "",
        c.doctorId?.name || "Unknown",
        c.doctorId?.email || ""
      ].map(val => {
        // Escape double quotes and wrap in quotes to preserve formatting
        const escaped = (val || "").toString().replace(/"/g, '""');
        return `"${escaped}"`;
      });
    });

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=clinical_cases.csv",
      },
    });
  } catch (error: any) {
    console.error("Export CSV error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
