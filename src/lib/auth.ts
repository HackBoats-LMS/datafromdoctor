import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { connectToDatabase } from "./db";
import { Doctor } from "./models";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: { doctorId: string; email: string; name: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET) as { doctorId: string; email: string; name: string };
  } catch (error) {
    return null;
  }
}

export async function getDoctorFromSession(): Promise<{ doctorId: string; email: string; name: string } | null> {
  const cookieStore = cookies();
  const token = cookieStore.get("session_token")?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  return payload;
}

export async function getAuthenticatedDoctor() {
  const session = await getDoctorFromSession();
  if (!session) return null;

  await connectToDatabase();
  const doctor = await Doctor.findById(session.doctorId);
  return doctor;
}
