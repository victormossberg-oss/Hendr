import {
  Bell,
  Home,
  Map,
  Plus,
  User,
} from "lucide-react";

function BottomNav({
  currentPage,
  onHome,
  onMap,
  onCreateEvent,
  onProfile,
  onNotifications,
  unreadNotifications,
}) {
  return (
    <nav className="bottom-nav" aria-label="Huvudnavigation">
      <button
        type="button"
        className={`nav-item ${currentPage === "home" ? "active" : ""}`}
        onClick={onHome}
      >
        <Home size={22} strokeWidth={2.2} />
        <span>Hem</span>
      </button>

      <button
        type="button"
        className={`nav-item ${currentPage === "map" ? "active" : ""}`}
        onClick={onMap}
      >
        <Map size={22} strokeWidth={2.2} />
        <span>Karta</span>
      </button>

      <button
        type="button"
        className="report-button"
        onClick={onCreateEvent}
        aria-label="Rapportera"
      >
        <Plus size={31} strokeWidth={2.2} />
        <span>Skapa</span>
      </button>

      <button
  type="button"
  className={`nav-item ${currentPage === "notifications" ? "active" : ""}`}
  onClick={onNotifications}
>
  <span className="notification-bell">
    <Bell size={22} strokeWidth={2.2} />

    {unreadNotifications > 0 && (
      <span className="notification-badge">
        {unreadNotifications}
      </span>
    )}
  </span>

  <span>Notiser</span>
</button>

      <button
        type="button"
        className={`nav-item ${currentPage === "profile" ? "active" : ""}`}
        onClick={onProfile}
      >
        <User size={22} strokeWidth={2.2} />
        <span>Profil</span>
      </button>
    </nav>
  );
}

export default BottomNav;