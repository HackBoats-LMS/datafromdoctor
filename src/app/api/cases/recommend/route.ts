import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Case } from "@/lib/models";
import { getDoctorFromSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const session = await getDoctorFromSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const { symptom, healthIssues } = await req.json();

    if (!symptom || !Array.isArray(symptom) || symptom.length === 0) {
      return NextResponse.json({ recommendations: [] });
    }

    // Escape and build regex patterns for case-insensitive matching
    const symptomRegexes = symptom.map(s => new RegExp(`^${escapeRegex(s.trim())}$`, "i"));

    // Find active cases matching any of the query symptoms
    const matchedCases = await Case.find({
      status: "active",
      symptom: { $in: symptomRegexes }
    }).lean();

    if (matchedCases.length === 0) {
      return NextResponse.json({ recommendations: [] });
    }

    const tabletScores: { [tablet: string]: number } = {};
    let totalScore = 0;

    const queryHealthIssues = Array.isArray(healthIssues) 
      ? healthIssues.map(h => h.trim().toLowerCase()) 
      : [];

    matchedCases.forEach((c: any) => {
      let score = 1; // Base score for matching symptom

      // Double score weights if patient health issues match comorbidities
      if (Array.isArray(c.healthIssues) && queryHealthIssues.length > 0) {
        c.healthIssues.forEach((issue: string) => {
          if (queryHealthIssues.includes(issue.trim().toLowerCase())) {
            score += 2; // Overlapping health issue gives higher relevance
          }
        });
      }

      const tablet = c.suggestedTablet;
      if (tablet) {
        tabletScores[tablet] = (tabletScores[tablet] || 0) + score;
        totalScore += score;
      }
    });

    // Format recommendations
    const recommendations = Object.keys(tabletScores).map(tablet => {
      const score = tabletScores[tablet];
      const confidence = totalScore > 0 ? Math.round((score / totalScore) * 100) : 0;
      return {
        tablet,
        score,
        confidence
      };
    });

    // Sort by score descending and return top 3
    recommendations.sort((a, b) => b.score - a.score);
    const topRecommendations = recommendations.slice(0, 3);

    return NextResponse.json({ recommendations: topRecommendations });
  } catch (error: any) {
    console.error("Recommendations API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

function escapeRegex(string: string) {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
}
