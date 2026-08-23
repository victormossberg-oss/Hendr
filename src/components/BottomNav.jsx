import {
  House,
  Map,
  Bookmark,
  UserRound
} from "lucide-react";

function BottomNav({
  onHome,
  onMap,
  onCreateEvent
}) {

  return (

    <nav className="bottom-nav">


      {/* =========================
          HEM
      ========================= */}

      <button
        className="nav-item"
        onClick={onHome}
      >

        <House className="nav-icon" />

        <span>
          Hem
        </span>

      </button>


      {/* =========================
          KARTA
      ========================= */}

      <button
        className="nav-item"
        onClick={onMap}
      >

        <Map className="nav-icon" />

        <span>
          Karta
        </span>

      </button>


      {/* =========================
          SKAPA
      ========================= */}

      <button
        className="report-button"
        onClick={onCreateEvent}
      >
        +
      </button>


      {/* =========================
          SPARADE
      ========================= */}

      <button
        className="nav-item"
      >

        <Bookmark className="nav-icon" />

        <span>
          Sparade
        </span>

      </button>


      {/* =========================
          PROFIL
      ========================= */}

      <button
        className="nav-item"
      >

        <UserRound className="nav-icon" />

        <span>
          Profil
        </span>

      </button>


    </nav>

  );

}

export default BottomNav;