import { useEffect, useState } from "react";
import { API_URL } from "../config";
import {
  Users,
  Newspaper,
  RefreshCw,
  CheckCircle,
  Bookmark
} from "lucide-react";

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reports, setReports] = useState([]);
  const [reportActionLoading, setReportActionLoading] = useState(null);

  async function handleReportAction(reportID, status) {
  const token = localStorage.getItem("hendr_token");

  if (!token) return;

  setReportActionLoading(reportID);

  try {
    const response = await fetch(
      `${API_URL}/api/admin/reports/${reportID}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Kunde inte hantera rapporten."
      );
    }

    setReports((currentReports) =>
      currentReports.map((report) =>
        report.id === reportID
          ? {
              ...report,
              status: data.status,
            }
          : report
      )
    );
  } catch (error) {
    console.error(
      "Fel vid hantering av rapport:",
      error
    );

    alert(error.message);
  } finally {
    setReportActionLoading(null);
  }
}

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

const reportsResponse = await fetch(
  `${API_URL}/api/admin/reports`,
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

if (!reportsResponse.ok) {
  throw new Error("Kunde inte hämta anmälningar.");
}

const reportsData = await reportsResponse.json();

setReports(reportsData);
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

        <div className="admin-stats">

  <div className="admin-stat-card">
    <div className="admin-stat-icon">
      <Users size={22} />
    </div>

    <span>Användare</span>
    <strong>{stats.userCount}</strong>
  </div>

  <div className="admin-stat-card">
    <div className="admin-stat-icon">
      <Newspaper size={22} />
    </div>

    <span>Artiklar</span>
    <strong>{stats.eventCount}</strong>
  </div>

  <div className="admin-stat-card">
    <div className="admin-stat-icon">
      <RefreshCw size={22} />
    </div>

    <span>Uppdateringar</span>
    <strong>{stats.observationCount}</strong>
  </div>

  <div className="admin-stat-card">
    <div className="admin-stat-icon">
      <CheckCircle size={22} />
    </div>

    <span>Bekräftelser</span>
    <strong>{stats.confirmationCount}</strong>
  </div>

  <div className="admin-stat-card">
    <div className="admin-stat-icon">
      <Bookmark size={22} />
    </div>

    <span>Följningar</span>
    <strong>{stats.followCount}</strong>
  </div>

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
            <span className={`admin-role ${user.role.toLowerCase()}`}>
              {user.role}
            </span>
            <span>{user.level}</span>
            <span>{user.xp}</span>
            <span>
              {new Date(user.createdAt).toLocaleDateString("sv-SE")}
            </span>
          </div>
        ))}

      </div>
    </section>

    <section className="admin-reports">
  <h2>Anmälningar</h2>

  <div className="admin-reports-list">

    {reports.length === 0 ? (
      <p>Inga anmälningar.</p>
    ) : (
      reports.map((report) => (
        <div
          className="admin-report-row"
          key={report.id}
        >
          <div>
            <strong>
  {report.eventID
    ? `Artikel: ${report.articleTitle || "Okänd artikel"}`
    : `Uppdatering`}
</strong>

{report.eventID && (
  <p>
    Artikel-ID: {report.eventID}
  </p>
)}

{report.articleDescription && (
  <p>
    Innehåll: {report.articleDescription}
  </p>
)}

{report.articleImageUrl && (
  <img
    src={report.articleImageUrl}
    alt="Anmäld artikel"
    className="admin-report-image"
  />
)}

{report.observationID && (
  <p>
    Uppdatering-ID: {report.observationID}
  </p>
)}

{report.updateDescription && (
  <p>
    Innehåll: {report.updateDescription}
  </p>
)}

{report.updateImageUrl && (
  <img
    src={report.updateImageUrl}
    alt="Anmäld uppdatering"
    className="admin-report-image"
  />
)}

<p>
  Anledning: {report.reason}
</p>

            {report.description && (
              <p>
                Beskrivning: {report.description}
              </p>
            )}
          </div>

          <div>
  <span>
  Rapporterad av:{" "}
  {report.reportedByUsername || "Okänd användare"}
</span>

  <span>
    Status: {report.status}
  </span>

  {report.status === "pending" && (
    <div className="admin-report-actions">

      <button
        type="button"
        onClick={() =>
          handleReportAction(
            report.id,
            "approved"
          )
        }
        disabled={
          reportActionLoading === report.id
        }
      >
        Godkänn
      </button>

      <button
        type="button"
        onClick={() => {
  const confirmed = window.confirm(
    "Är du säker på att du vill ta bort det anmälda innehållet?"
  );

  if (!confirmed) return;

  handleReportAction(
    report.id,
    "removed"
  );
}}
        disabled={
          reportActionLoading === report.id
        }
      >
        Ta bort innehåll
      </button>

    </div>
  )}
</div>
        </div>
      ))
    )}

  </div>
</section>

  </div>
);

  
}

export default AdminDashboard;