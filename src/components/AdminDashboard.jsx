import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadStats = async () => {
      try {
        const token = localStorage.getItem("hendr_token");

        const response = await fetch(
          `${API_URL}/api/admin/stats`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Kunde inte hämta statistik.");
        }

        const data = await response.json();

        setStats(data);
      } catch (error) {
        console.error(
          "Fel vid hämtning av admin-statistik:",
          error
        );

        setError(
          "Kunde inte hämta admin-statistik."
        );
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) {
    return <p>Laddar admin-dashboard...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div className="admin-dashboard">

      <h1>Admin Dashboard</h1>

      <div className="admin-stats">

        <div className="admin-stat-card">
          <span>Användare</span>
          <strong>{stats.userCount}</strong>
        </div>

        <div className="admin-stat-card">
          <span>Artiklar</span>
          <strong>{stats.eventCount}</strong>
        </div>

        <div className="admin-stat-card">
          <span>Uppdateringar</span>
          <strong>{stats.observationCount}</strong>
        </div>

        <div className="admin-stat-card">
          <span>Bekräftelser</span>
          <strong>{stats.confirmationCount}</strong>
        </div>

        <div className="admin-stat-card">
          <span>Följningar</span>
          <strong>{stats.followCount}</strong>
        </div>

      </div>

    </div>
  );
}

export default AdminDashboard;