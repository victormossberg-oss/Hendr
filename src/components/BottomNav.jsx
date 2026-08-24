import {
  House,
  Map,
  Bookmark,
  UserRound
} from "lucide-react";

function BottomNav({
  currentPage,
  onHome,
  onMap,
  onCreateEvent,
  onProfile
}) {

  return (

    <nav className="bottom-nav">


      {/* =========================
          HEM
      ========================= */}

      <button
  className={`nav-item ${
    currentPage === "home"
      ? "active"
      : ""
  }`}
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
  className={`nav-item ${
    currentPage === "map"
      ? "active"
      : ""
  }`}
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
  className={`nav-item ${
    currentPage === "profile"
      ? "active"
      : ""
  }`}
  onClick={onProfile}
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