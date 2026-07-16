"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface CaseRecord {
  _id: string;
  symptom: string[];
  foodIntake: string;
  healthIssues: string[];
  allergies: string[];
  currentMedications: string[];
  othersCauses?: string[];
  age?: string;
  suggestedTablet?: string;
  dosageNotes?: string;
  prescriptions?: { tablet: string; dosage?: string }[];
  consultDoctor?: boolean;
  suggestions?: string[];
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

interface StatsData {
  totalCases: number;
  topSymptoms: { name: string; count: number }[];
  topTablets: { name: string; count: number }[];
  comorbidities: { name: string; count: number; percentage: number }[];
}

export default function CasesPage() {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("active");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Insights Dashboard States
  const [stats, setStats] = useState<StatsData | null>(null);
  const [showDashboard, setShowDashboard] = useState(true);

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

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/cases/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to load dashboard metrics:", err);
    }
  };

  useEffect(() => {
    fetchCases();
  }, [page, statusFilter]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const handleDeleteCase = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this case? This action cannot be undone.")) return;
    
    try {
      const res = await fetch(`/api/cases/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete case");
      }
      fetchCases();
      fetchStats();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div>
      {/* Title Header */}
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1 className="page-title">Case Log Directory</h1>
          <p className="page-subtitle">Browse and revise historical patient case entries</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowDashboard(!showDashboard)}
            style={{ height: "40px", fontSize: "0.85rem", marginTop: 0, display: "inline-flex", alignItems: "center" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: "16px", height: "16px", marginRight: "0.25rem" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125z" />
            </svg>
            {showDashboard ? "Hide Insights" : "Show Insights"}
          </button>
          <a
            href="/api/cases/export"
            download
            className="btn btn-secondary"
            style={{ height: "40px", display: "inline-flex", alignItems: "center", padding: "0 0.75rem", fontSize: "0.85rem", marginTop: 0 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: "16px", height: "16px", marginRight: "0.25rem" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            JSON
          </a>
          <a
            href="/api/cases/export-csv"
            download="clinical_cases.csv"
            className="btn btn-secondary"
            style={{ height: "40px", display: "inline-flex", alignItems: "center", padding: "0 0.75rem", fontSize: "0.85rem", marginTop: 0 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: "16px", height: "16px", marginRight: "0.25rem" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            CSV
          </a>
          <label className="form-label" style={{ margin: 0, whiteSpace: "nowrap", marginLeft: "0.5rem" }}>Status:</label>
          <select
            value={statusFilter}
            onChange={handleStatusChange}
            className="form-control"
            style={{ width: "120px", height: "40px", padding: "0.5rem" }}
          >
            <option value="active">Active</option>
            <option value="revised">Revised</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Collapsible Dashboard Banner */}
      {showDashboard && stats && (
        <div className="card" style={{ marginBottom: "2rem", padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1.1rem", color: "var(--primary)", marginBottom: "1rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: "20px", height: "20px", color: "var(--primary)" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125z" />
            </svg>
            Clinical Insights Dashboard
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem" }}>
            
            {/* Total Cases logged */}
            <div style={{ borderRight: "1px solid var(--border)", paddingRight: "1rem" }}>
              <span style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: "600", display: "block" }}>
                Total Active Cases
              </span>
              <strong style={{ fontSize: "2.5rem", color: "var(--primary)", display: "block", marginTop: "0.25rem" }}>
                {stats.totalCases}
              </strong>
              <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                Patient logs saved in database
              </span>
            </div>

            {/* Top Symptoms */}
            <div style={{ borderRight: "1px solid var(--border)", paddingRight: "1rem" }}>
              <span style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: "600", display: "block", marginBottom: "0.5rem" }}>
                Top Symptoms
              </span>
              {stats.topSymptoms.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {stats.topSymptoms.map(sym => (
                    <div key={sym.name} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                      <span style={{ textTransform: "capitalize", fontWeight: 500 }}>{sym.name}</span>
                      <span style={{ color: "var(--text-muted)" }}>{sym.count} cases</span>
                    </div>
                  ))}
                </div>
              ) : (
                <span style={{ fontStyle: "italic", fontSize: "0.85rem", color: "var(--text-muted)" }}>No logs recorded</span>
              )}
            </div>

            {/* Top Tablets */}
            <div style={{ borderRight: "1px solid var(--border)", paddingRight: "1rem" }}>
              <span style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: "600", display: "block", marginBottom: "0.5rem" }}>
                Top Tablets Suggested
              </span>
              {stats.topTablets.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {stats.topTablets.map(tab => (
                    <div key={tab.name} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem" }}>
                      <span style={{ fontWeight: 500 }}>{tab.name}</span>
                      <span style={{ color: "var(--text-muted)" }}>{tab.count} cases</span>
                    </div>
                  ))}
                </div>
              ) : (
                <span style={{ fontStyle: "italic", fontSize: "0.85rem", color: "var(--text-muted)" }}>No logs recorded</span>
              )}
            </div>

            {/* Comorbidities Breakdown */}
            <div>
              <span style={{ fontSize: "0.8rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: "600", display: "block", marginBottom: "0.5rem" }}>
                Comorbidity Patient Ratio
              </span>
              {stats.comorbidities.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {stats.comorbidities.slice(0, 3).map(com => (
                    <div key={com.name} style={{ fontSize: "0.85rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.15rem" }}>
                        <span style={{ textTransform: "capitalize", fontWeight: 500 }}>{com.name}</span>
                        <span>{com.percentage}%</span>
                      </div>
                      <div style={{ height: "4px", backgroundColor: "var(--border)", borderRadius: "2px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${com.percentage}%`, backgroundColor: "var(--accent)" }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <span style={{ fontStyle: "italic", fontSize: "0.85rem", color: "var(--text-muted)" }}>No logs recorded</span>
              )}
            </div>

          </div>
        </div>
      )}

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
                  <div className="case-symptom" style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: "18px", height: "18px", color: "var(--primary)" }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                    </svg>
                    {Array.isArray(item.symptom) ? item.symptom.join(", ") : item.symptom}
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
                          <span key={issue} style={{ fontSize: "0.8rem", background: "rgba(0, 0, 0, 0.04)", border: "1px solid var(--border)", padding: "0.15rem 0.4rem", borderRadius: "4px" }}>
                            {issue}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontStyle: "italic" }}>None listed</span>
                      )}
                    </div>
                  </div>

                  {item.othersCauses && item.othersCauses.length > 0 && (
                    <div className="case-section" style={{ marginBottom: "0.75rem" }}>
                      <span className="case-section-title">Others Causes</span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.25rem" }}>
                        {item.othersCauses.map((cause) => (
                          <span key={cause} style={{ fontSize: "0.8rem", background: "rgba(0, 0, 0, 0.04)", border: "1px solid var(--border)", padding: "0.15rem 0.4rem", borderRadius: "4px" }}>
                            {cause}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {item.age && (
                    <div className="case-section" style={{ marginBottom: "0.75rem" }}>
                      <span className="case-section-title">Patient Age Group</span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginTop: "0.25rem" }}>
                        <span style={{ fontSize: "0.8rem", background: "rgba(0, 0, 0, 0.04)", border: "1px solid var(--border)", padding: "0.15rem 0.4rem", borderRadius: "4px" }}>
                          {item.age}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="case-treatment-plan">
                  {item.prescriptions && item.prescriptions.length > 0 ? (
                    item.prescriptions.map((presc, idx) => (
                      <div key={idx} style={{ marginBottom: "1rem", paddingBottom: idx !== item.prescriptions!.length - 1 ? "1rem" : 0, borderBottom: idx !== item.prescriptions!.length - 1 ? "1px solid var(--border)" : "none" }}>
                        <div className="case-section" style={{ marginBottom: "0.5rem" }}>
                          <span className="case-section-title">Suggested Tablet</span>
                          <span className="case-section-value" style={{ fontSize: "1.1rem", fontWeight: "600", color: "var(--primary)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: "18px", height: "18px", color: "var(--primary)" }}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                            {presc.tablet}
                          </span>
                        </div>
                        <div className="case-section">
                          <span className="case-section-title">Dosage Instructions</span>
                          <span className="case-section-value" style={{ fontStyle: presc.dosage ? "normal" : "italic" }}>
                            {presc.dosage || "No dosage instructions provided"}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="case-section" style={{ marginBottom: "0.75rem" }}>
                        <span className="case-section-title">Suggested Tablet</span>
                        <span className="case-section-value" style={{ fontSize: "1.1rem", fontWeight: "600", color: "var(--primary)", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: "18px", height: "18px", color: "var(--primary)" }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                          </svg>
                          {item.suggestedTablet || "Unknown"}
                        </span>
                      </div>
                      <div className="case-section">
                        <span className="case-section-title">Dosage Instructions</span>
                        <span className="case-section-value" style={{ fontStyle: item.dosageNotes ? "normal" : "italic" }}>
                          {item.dosageNotes || "No dosage instructions provided"}
                        </span>
                      </div>
                    </>
                  )}

                  {item.consultDoctor && (
                    <div className="case-section" style={{ marginTop: "0.75rem" }}>
                      <span className="case-section-value" style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", color: "var(--primary)", fontWeight: "600", fontSize: "0.85rem", background: "rgba(2, 132, 199, 0.1)", padding: "0.25rem 0.5rem", borderRadius: "4px" }}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: "16px", height: "16px" }}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Patient Advised to Consult Doctor
                      </span>
                    </div>
                  )}

                  {item.suggestions && item.suggestions.length > 0 && (
                    <div className="case-section" style={{ marginTop: "0.75rem" }}>
                      <span className="case-section-title">Additional Suggestions</span>
                      <ul style={{ margin: "0.25rem 0 0 0", paddingLeft: "1.2rem", fontSize: "0.9rem", color: "var(--text-secondary)" }}>
                        {item.suggestions.map((suggestion, idx) => (
                          <li key={idx} style={{ marginBottom: "0.2rem" }}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {item.status === "active" && (
                <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid var(--border)", paddingTop: "0.75rem", gap: "0.5rem" }}>
                  <button onClick={() => handleDeleteCase(item._id)} className="btn btn-secondary" style={{ padding: "0.4rem 1rem", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "0.35rem", color: "red" }}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: "14px", height: "14px" }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                    </svg>
                    Delete
                  </button>
                  <Link href={`/?edit=${item._id}`} className="btn btn-secondary" style={{ padding: "0.4rem 1rem", fontSize: "0.85rem", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: "14px", height: "14px" }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.83 20.013a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                    </svg>
                    Revise/Edit Case
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
            style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: "16px", height: "16px" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
            Previous
          </button>
          <span style={{ fontSize: "0.95rem", color: "var(--text-secondary)" }}>
            Page <strong>{page}</strong> of <strong>{totalPages}</strong>
          </span>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="btn btn-secondary"
            style={{ display: "inline-flex", alignItems: "center", gap: "0.25rem" }}
          >
            Next
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: "16px", height: "16px" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
