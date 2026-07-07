"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/logout", {
        method: "POST",
      });
      if (res.ok) {
        router.refresh();
        router.push("/login");
      }
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="btn btn-secondary"
      style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}
      disabled={loading}
    >
      {loading ? "Logging out..." : "Logout"}
    </button>
  );
}
