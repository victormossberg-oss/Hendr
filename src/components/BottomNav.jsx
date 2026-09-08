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
        <span>Rapportera</span>
      </button>

      <button
        type="button"
        className={`nav-item ${currentPage === "notifications" ? "active" : ""}`}
        onClick={onNotifications}
      >
        <Bell size={22} strokeWidth={2.2} />
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