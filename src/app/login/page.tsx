"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Invalid medical credentials");
      }

      setMessage({ type: "success", text: "Logged in successfully!" });
      window.location.href = "/";
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "calc(100vh - 140px)" }}>
      <div className="card" style={{ width: "100%", maxWidth: "450px" }}>
        <h2 style={{ fontSize: "1.75rem", fontWeight: "700", marginBottom: "0.5rem", textAlign: "center" }}>
          Portal Sign In
        </h2>
        <p style={{ color: "var(--text-secondary)", textAlign: "center", marginBottom: "1.5rem", fontSize: "0.9rem" }}>
          Authenticate to access patient case histories
        </p>

        {/* Demo / Seed Credentials helper */}
        <div style={{
          backgroundColor: "rgba(2, 132, 199, 0.08)",
          border: "1px dashed rgba(2, 132, 199, 0.3)",
          borderRadius: "var(--radius-md)",
          padding: "1rem",
          marginBottom: "1.5rem",
          fontSize: "0.85rem",
          color: "var(--text-secondary)"
        }}>
          <strong style={{ color: "var(--primary)", display: "flex", alignItems: "center", gap: "0.25rem", marginBottom: "0.25rem" }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: "16px", height: "16px", color: "var(--primary)" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 1 1 1.085 1.085l-.041.02a.75.75 0 0 1-1.085-1.085ZM12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12.25 8.5a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
            </svg>
            Login Credentials:
          </strong>
          Email: <code style={{ color: "var(--text-primary)" }}>doctor@gmail.com</code><br />
          Password: <code style={{ color: "var(--text-primary)" }}>doctor123</code>
        </div>

        {message && (
          <div className={`toast toast-${message.type}`} style={{ padding: "0.75rem 1rem", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
            {message.type === "success" ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: "16px", height: "16px" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: "16px", height: "16px" }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
              </svg>
            )}
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Medical Email Address <span className="required">*</span></label>
            <input
              id="email"
              name="email"
              type="email"
              className="form-control"
              value={formData.email}
              onChange={handleChange}
              placeholder="doctor@gmail.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password <span className="required">*</span></label>
            <input
              id="password"
              name="password"
              type="password"
              className="form-control"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: "1rem" }} disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
