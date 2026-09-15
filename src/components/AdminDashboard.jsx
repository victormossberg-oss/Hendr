import { useEffect, useState } from "react";
import { API_URL } from "../config";



function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
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

        const usersResponse = await fetch(
  `${API_URL}/api/admin/users`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

if (!usersResponse.ok) {
  throw new Error("Kunde inte hämta användare.");
}

const usersData = await usersResponse.json();

setUsers(usersData);
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

    <div className="admin-header">
      <h1>Admin Dashboard</h1>
      <p>Översikt över HENDR</p>
    </div>

    <section className="admin-overview">
      <h2>Översikt</h2>

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
    </section>

    <section className="admin-users">
      <h2>Användare</h2>

      <div className="admin-users-table">

        <div className="admin-users-header">
          <span>Användare</span>
          <span>Roll</span>
          <span>Level</span>
          <span>XP</span>
          <span>Skapad</span>
        </div>

        {users.map((user) => (
          <div
            className="admin-user-row"
            key={user.userid}
          >
            <span>{user.username}</span>
            <span>{user.role}</span>
            <span>{user.level}</span>
            <span>{user.xp}</span>
            <span>
              {new Date(user.createdAt).toLocaleDateString("sv-SE")}
            </span>
          </div>
        ))}

      </div>
    </section>

  </div>
);

  
}

export default AdminDashboard;