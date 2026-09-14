import { useEffect, useState } from "react";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000";

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const token =
  localStorage.getItem("hendr_token");

console.log("ADMIN TOKEN:", token);
console.log(
  "ADMIN API URL:",
  `${API_URL}/api/admin/stats`
);

        const response = await fetch(
          `${API_URL}/api/admin/stats`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log("ADMIN RESPONSE STATUS:", response.status);

        if (!response.ok) {
          throw new Error(
            "Kunde inte hämta statistik."
          );
        }

        const data = await response.json();

        setStats(data);
      } catch (error) {
        console.error(
          "Fel vid hämtning av admin-statistik:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  if (loading) {
    return <p>Laddar statistik...</p>;
  }

  if (!stats) {
    return <p>Kunde inte hämta statistik.</p>;
  }

  return (
    <section className="admin-dashboard">
      <h1>Admin</h1>

      <div className="admin-stats">
        <div className="admin-stat">
          <strong>{stats.userCount}</strong>
          <span>Användare</span>
        </div>

        <div className="admin-stat">
          <strong>{stats.eventCount}</strong>
          <span>Artiklar</span>
        </div>

        <div className="admin-stat">
          <strong>{stats.observationCount}</strong>
          <span>Uppdateringar</span>
        </div>

        <div className="admin-stat">
          <strong>{stats.confirmationCount}</strong>
          <span>Bekräftelser</span>
        </div>

        <div className="admin-stat">
          <strong>{stats.followCount}</strong>
          <span>Följningar</span>
        </div>
      </div>
    </section>
  );
}

export default AdminDashboard;