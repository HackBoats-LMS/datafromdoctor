"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface CaseRecord {
  _id: string;
  symptom: string;
  foodIntake: string;
  healthIssues: string[];
  allergies: string[];
  currentMedications: string[];
  suggestedTablet: string;
  dosageNotes?: string;
  doctorId: {
    _id: string;
    name: string;
    email: string;
  };
  status: "active" | "revised" | "archived";
  version: number;
  createdAt: string;
  updatedAt: string;
}

export default function CasesPage() {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("active");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const fetchCases = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/cases?page=${page}&limit=5&status=${statusFilter}`);
      if (!res.ok) {
        throw new Error("Failed to load clinical cases");
      }
      const data = await res.json();
      setCases(data.cases || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [page, statusFilter]);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  return (
    <div>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="page-title">Case Log Directory</h1>
          <p className="page-subtitle">Browse and revise historical patient case entries</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <a
            href="/api/cases/export"
            download
            className="btn btn-secondary"
            style={{ height: "40px", display: "inline-flex", alignItems: "center", padding: "0 1rem", fontSize: "0.9rem", marginTop: 0 }}
          >
             Export Data
          </a>
          <label className="form-label" style={{ margin: 0, whiteSpace: "nowrap" }}>Status Filter:</label>
          <select
            value={statusFilter}
            onChange={handleStatusChange}
            className="form-control"
            style={{ width: "130px", height: "40px", padding: "0.5rem" }}
          >
            <option value="active">Active</option>
            <option value="revised">Revised</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="toast toast-error" style={{ marginBottom: "1.5rem" }}>
          ⚠️ {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem" }}>Loading case history files...</div>
      ) : cases.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "4rem", color: "var(--text-secondary)" }}>
          <p style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>No case records found matching this status filter.</p>
          <Link href="/" className="btn btn-primary">Log First Patient Case</Link>
        </div>
      ) : (
        <div className="history-grid">
          {cases.map((item) => (
            <div key={item._id} className="case-card">
              <div className="case-header">
                <div>
                  <div className="case-symptom">
                    <span>🩺</span> {Array.isArray(item.symptom) ? item.symptom.join(", ") : item.symptom}
                  </div>
                  <div className="case-meta" style={{ marginTop: "0.25rem" }}>
                    <span>Logged on: {new Date(item.createdAt).toLocaleString()}</span>
                    <span>•</span>
                    <span>Physician: <strong>{item.doctorId?.name || "Unknown"}</strong></span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <span style={{ fontSize: "0.85rem", background: "rgba(255, 255, 255, 0.05)", padding: "0.25rem 0.5rem", borderRadius: "4px", border: "1px solid var(--border)" }}>
                    Version {item.version}
                  </span>
                  <span className={`badge badge-${item.status}`}>
                    {item.status}
                  </span>
                </div>
              </div>

              <div className="case-body">
                <div>
                  <div className="case-section" style={{ marginBottom: "0.75rem" }}>
                    <span className="case-section-title">Comorbidities (Health Issues)</span>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.25rem" }}>
                      {item.healthIssues?.length > 0 ? (
                        item.healthIssues.map((issue) => (
                          <span key={issue} style={{ fontSize: "0.8rem", background: "rgba(255, 255, 255, 0.05)", border: "1px solid var(--border)", padding: "0.15rem 0.4rem", borderRadius: "4px" }}>
                            {issue}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontStyle: "italic" }}>None listed</span>
                      )}
                    </div>
                  </div>

                  {/* Removed extra patient context fields */}
                </div>

                <div className="case-treatment-plan">
                  <div className="case-section" style={{ marginBottom: "0.75rem" }}>
                    <span className="case-section-title">Suggested Tablet</span>
                    <span className="case-section-value" style={{ fontSize: "1.1rem", fontWeight: "600", color: "var(--primary-hover)" }}>
                      💊 {item.suggestedTablet}
                    </span>
                  </div>

                  <div className="case-section">
                    <span className="case-section-title">Dosage Instructions</span>
                    <span className="case-section-value" style={{ fontStyle: item.dosageNotes ? "normal" : "italic" }}>
                      {item.dosageNotes || "No dosage instructions provided"}
                    </span>
                  </div>
                </div>
              </div>

              {item.status === "active" && (
                <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid var(--border)", paddingTop: "0.75rem" }}>
                  <Link href={`/?edit=${item._id}`} className="btn btn-secondary" style={{ padding: "0.4rem 1rem", fontSize: "0.85rem" }}>
                    ✏️ Revise/Edit Case
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="btn btn-secondary"
          >
            ← Previous
          </button>
          <span style={{ fontSize: "0.95rem", color: "var(--text-secondary)" }}>
            Page <strong>{page}</strong> of <strong>{totalPages}</strong>
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="btn btn-secondary"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
