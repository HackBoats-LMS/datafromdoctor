import { NextResponse } from "next/server";
import { getDoctorFromSession } from "@/lib/auth";

export async function GET() {
  const session = await getDoctorFromSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ doctor: session });
}
