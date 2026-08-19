import {
  House,
  Map,
  Bookmark,
  UserRound
} from "lucide-react";

function BottomNav() {
  return (
    <nav className="bottom-nav">

      <button className="nav-item active">
        <House className="nav-icon" />
        <span>Hem</span>
      </button>

      <button className="nav-item">
        <Map className="nav-icon" />
        <span>Karta</span>
      </button>

      <button className="report-button">
        +
      </button>

      <button className="nav-item">
        <Bookmark className="nav-icon" />
        <span>Sparade</span>
      </button>

      <button className="nav-item">
        <UserRound className="nav-icon" />
        <span>Profil</span>
      </button>

    </nav>
  );
}

export default BottomNav;