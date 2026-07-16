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

    // Fetch all active cases to build dashboard metrics
    const cases = await Case.find({ status: "active" }).lean();

    const totalCases = cases.length;
    const symptomCounts: { [key: string]: number } = {};
    const tabletCounts: { [key: string]: number } = {};
    const comorbidityCounts: { [key: string]: number } = {};

    cases.forEach((c: any) => {
      // Symptoms
      if (Array.isArray(c.symptom)) {
        c.symptom.forEach((s: string) => {
          const val = s.trim().toLowerCase();
          if (val) symptomCounts[val] = (symptomCounts[val] || 0) + 1;
        });
      }

      // Tablets
      if (c.prescriptions && c.prescriptions.length > 0) {
        c.prescriptions.forEach((p: any) => {
          if (p.tablet) {
            const val = p.tablet.trim();
            if (val) tabletCounts[val] = (tabletCounts[val] || 0) + 1;
          }
        });
      } else if (c.suggestedTablet) {
        const val = c.suggestedTablet.trim();
        if (val) tabletCounts[val] = (tabletCounts[val] || 0) + 1;
      }

      // Comorbidities (Health issues)
      if (Array.isArray(c.healthIssues)) {
        c.healthIssues.forEach((issue: string) => {
          const val = issue.trim().toLowerCase();
          if (val) comorbidityCounts[val] = (comorbidityCounts[val] || 0) + 1;
        });
      }
    });

    const getTopThree = (counts: { [key: string]: number }) => {
      return Object.keys(counts)
        .map(key => ({ name: key, count: counts[key] }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
    };

    return NextResponse.json({
      totalCases,
      topSymptoms: getTopThree(symptomCounts),
      topTablets: getTopThree(tabletCounts),
      comorbidities: Object.keys(comorbidityCounts).map(name => ({
        name,
        count: comorbidityCounts[name],
        percentage: totalCases > 0 ? Math.round((comorbidityCounts[name] / totalCases) * 100) : 0
      })).sort((a, b) => b.count - a.count)
    });
  } catch (error: any) {
    console.error("Stats API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
