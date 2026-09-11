import { useEffect, useState } from "react";
import { Edit, Settings, X } from "lucide-react";
import { API_URL } from "../config";

function Profile({
  user,
  onEventClick,
  onObservationClick,
  onLogout
}) {

  const [events, setEvents] =
    useState([]);

  const [observations, setObservations] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [showEvents, setShowEvents] =
    useState(false);

  const [showObservations, setShowObservations] =
    useState(false);

  const [showSettings, setShowSettings] =
    useState(false);

  const [editingProfile, setEditingProfile] =
  useState(false);

const [bio, setBio] =
  useState(
    user.bio ||
    "Rapporterar om vad som händer och håller dig uppdaterad."
  );

const [location, setLocation] = useState(
  user.location || ""
);

useEffect(() => {
  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem("hendr_token");

      const response = await fetch(
        `${API_URL}/api/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Kunde inte hämta profilen."
        );
      }

      const data = await response.json();

      if (data.user) {
        setBio(data.user.bio || "");
        setLocation(data.user.location || "");
      }

    } catch (error) {
      console.error(
        "Fel vid hämtning av profil:",
        error
      );
    }
  };

  fetchCurrentUser();
}, []);


  // =========================
  // HÄMTA MINA DATA
  // =========================

  useEffect(() => {

    async function fetchMyData() {

      try {

        const token =
          localStorage.getItem(
            "hendr_token"
          );


        if (!token) {
          return;
        }


        const headers = {
          Authorization:
            `Bearer ${token}`
        };


        // =========================
        // HÄMTA HÄNDELSER
        // =========================

        const eventsResponse =
          await fetch(
            `${API_URL}/api/users/me/events`,
            {
              headers
            }
          );


        if (!eventsResponse.ok) {

          throw new Error(
            "Kunde inte hämta dina händelser"
          );

        }


        const eventsData =
          await eventsResponse.json();


        setEvents(
          eventsData
        );


        // =========================
        // HÄMTA OBSERVATIONER
        // =========================

        const observationsResponse =
          await fetch(
            `${API_URL}/api/users/me/observations`,
            {
              headers
            }
          );


        if (!observationsResponse.ok) {

          throw new Error(
            "Kunde inte hämta dina observationer"
          );

        }


        const observationsData =
          await observationsResponse.json();


        setObservations(
          observationsData
        );


      } catch (error) {

        console.error(
          "Fel vid hämtning av profildata:",
          error
        );


      } finally {

        setLoading(false);

      }

    }


    fetchMyData();

  }, []);


  // =========================
  // PROFILDATA
  // =========================

  const initial =
    user.username
      ? user.username
          .charAt(0)
          .toUpperCase()
      : "?";


  const createdDate =
    user.created_at
      ? new Date(
          user.created_at
        ).toLocaleDateString(
          "sv-SE",
          {
            year: "numeric",
            month: "long",
            day: "numeric"
          }
        )
      : "Okänt";


  // =========================
  // MINA HÄNDELSER
  // =========================

  if (showEvents) {

    return (

      <main className="profile-page">

        <div className="profile-content">

          <section className="profile-list-page">

            <button
              className="back-button"
              type="button"
              onClick={() =>
                setShowEvents(false)
              }
            >
              ← Tillbaka
            </button>


            <h1>
              Mina händelser
            </h1>


            {loading ? (

              <div className="profile-empty">

                Hämtar dina händelser...

              </div>

            ) : events.length === 0 ? (

              <div className="profile-empty">

                Du har inte skapat några
                händelser ännu.

              </div>

            ) : (

              <div className="profile-events">

                {events.map(
                  (event) => (

                    <button
                      className="profile-event"
                      key={event.id}
                      type="button"
                      onClick={() =>
                        onEventClick(event)
                      }
                    >

                      <span className="event-category">

                        {event.category}

                      </span>


                      <h3>

                        {event.title}

                      </h3>


                      <p>

                        {event.description}

                      </p>


                      <span className="event-time">

                        {event.createdAt
                          ? new Date(
                              event.createdAt
                            ).toLocaleString(
                              "sv-SE"
                            )
                          : ""}

                      </span>

                    </button>

                  )
                )}

              </div>

            )}

          </section>

        </div>

      </main>

    );

  }


  // =========================
  // MINA OBSERVATIONER
  // =========================

  if (showObservations) {

    return (

      <main className="profile-page">

        <div className="profile-content">

          <section className="profile-list-page">

            <button
              className="back-button"
              type="button"
              onClick={() =>
                setShowObservations(false)
              }
            >
              ← Tillbaka
            </button>


            <h1>
              Mina observationer
            </h1>


            {loading ? (

              <div className="profile-empty">

                Hämtar dina observationer...

              </div>

            ) : observations.length === 0 ? (

              <div className="profile-empty">

                Du har inte lagt till några
                observationer ännu.

              </div>

            ) : (

              <div className="profile-events">

                {observations.map(
                  (observation) => (

                    <button
                      className="profile-event"
                      key={observation.id}
                      type="button"
                      onClick={() =>
                        onObservationClick(
                          observation
                        )
                      }
                    >

                      <span className="event-category">

                        Observation

                      </span>


                      <p>

                        {observation.description}

                      </p>


                      <span className="event-time">

                        {observation.createdAt
                          ? new Date(
                              observation.createdAt
                            ).toLocaleString(
                              "sv-SE"
                            )
                          : ""}

                      </span>

                    </button>

                  )
                )}

              </div>

            )}

          </section>

        </div>

      </main>

    );

  }


   // =========================
  // VANLIG PROFIL
  // =========================

  const articleCount = events.length;

  const confirmationCount = events.reduce(
    (total, event) =>
      total + (Number(event.confirmationCount) || 0),
    0
  );

  const updateCount = events.reduce(
    (total, event) =>
      total + (Number(event.observationCount) || 0),
    0
  );

  return (
    <main className="profile-page">

      <div className="profile-content">

        {/* =========================
            PROFILHEADER
        ========================= */}

        <section className="profile-header">

  <button
    type="button"
    className="profile-settings-button"
    onClick={() => setShowSettings(true)}
    aria-label="Inställningar"
  >
    <Settings size={21} strokeWidth={1.7} />
  </button>

  <div className="profile-avatar-wrapper">

    <div className="profile-avatar">
      {initial}
    </div>

    <button
      type="button"
      className="profile-avatar-edit"
      aria-label="Ändra profilbild"
    >
      +
    </button>

  </div>

  <h1>
    {user.username}
  </h1>

 

 {location && (
  <p className="profile-location">
    {location}
  </p>
)}

  {bio && (
  <p className="profile-bio">
    {bio}
  </p>
)}

</section>

        {showSettings && (
  <div className="profile-settings-overlay">

    <div className="profile-settings-panel">

      <div className="profile-settings-header">

        <h2>
          Inställningar
        </h2>

        <button
          type="button"
          onClick={() => setShowSettings(false)}
          aria-label="Stäng"
        >
          <X size={20} />
        </button>

      </div>

      <button
  type="button"
  className="profile-settings-item"
  onClick={() => {
    setShowSettings(false);
    setEditingProfile(true);
  }}
>
  <Edit size={17} />
  Redigera profil
</button>

      <button
        type="button"
        className="profile-settings-item profile-settings-logout"
        onClick={onLogout}
      >
        Logga ut
      </button>

    </div>

  </div>
)}

{editingProfile && (
  <section className="profile-edit-panel">

    <div className="profile-edit-header">

      <h2>
        Redigera profil
      </h2>

      <button
        type="button"
        onClick={() => setEditingProfile(false)}
        aria-label="Stäng"
      >
        <X size={20} />
      </button>

    </div>
    <label className="profile-edit-label">
  Plats
  <input
    type="text"
    value={location}
    onChange={(e) => setLocation(e.target.value)}
    maxLength={255}
    placeholder="Exempelvis Stockholm, Sverige"
  />
</label>

    <label className="profile-edit-label">
      Presentation

      <textarea
        value={bio}
        onChange={(e) =>
          setBio(e.target.value)
        }
        maxLength={180}
        placeholder="Berätta kort om dig själv..."
        rows={4}
      />
    </label>

    <div className="profile-edit-counter">
      {bio.length}/180
    </div>

    <button
  type="button"
  className="profile-save-button"
  onClick={async () => {
    try {
      const token = localStorage.getItem("hendr_token");

      const response = await fetch(
        `${API_URL}/api/users/me/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            bio,
            location,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Kunde inte spara profilen."
        );
      }

      setEditingProfile(false);

      console.log("Profil sparad:", data);

    } catch (error) {
      console.error(
        "Fel vid sparande av profil:",
        error
      );

      alert(error.message);
    }
  }}
>
  Spara profil
</button>

  </section>
)}

        {/* =========================
            STATISTIK
        ========================= */}

        <section className="profile-stats">

          <div className="profile-stat">
            <strong>
              {loading ? "–" : articleCount}
            </strong>

            <span>
              artiklar
            </span>
          </div>

          <div className="profile-stat">
            <strong>
              {loading ? "–" : confirmationCount}
            </strong>

            <span>
              bekräftelser
            </span>
          </div>

          <div className="profile-stat">
            <strong>
              {loading ? "–" : updateCount}
            </strong>

            <span>
              uppdateringar
            </span>
          </div>

        </section>


        {/* =========================
            SKAPA ARTIKEL
        ========================= */}

        <button
          type="button"
          className="profile-create-button"
          onClick={() => {
            // Skapas i nästa steg
          }}
        >
          <span>
            +
          </span>

          Skapa ny artikel
        </button>


        {/* =========================
            MINA SENASTE ARTIKLAR
        ========================= */}

        <section className="profile-articles">

          <div className="profile-section-heading">

            <h2>
              Mina senaste artiklar
            </h2>

            {events.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  setShowEvents(true)
                }
              >
                Visa alla →
              </button>
            )}

          </div>


          {loading ? (

            <div className="profile-empty">
              Hämtar dina artiklar...
            </div>

          ) : events.length === 0 ? (

            <div className="profile-empty">
              Du har inte skapat några artiklar ännu.
            </div>

          ) : (

            <div className="profile-article-list">

              {events.slice(0, 5).map((event) => (

                <button
                  type="button"
                  className="profile-article"
                  key={event.id}
                  onClick={() =>
                    onEventClick(event)
                  }
                >

                  <div className="profile-article-image">

                    {event.imageUrl ? (
                      <img
                        src={event.imageUrl}
                        alt=""
                      />
                    ) : (
                      <div className="profile-article-placeholder">
                        {event.category || "Annat"}
                      </div>
                    )}

                  </div>


                  <div className="profile-article-content">

                    <span className="profile-article-category">
                      {event.category || "Annat"}
                    </span>

                    <h3>
                      {event.title}
                    </h3>

                    {event.description && (
                      <p>
                        {event.description}
                      </p>
                    )}

                    <div className="profile-article-meta">

                      <span>
                        {event.createdAt
                          ? new Date(
                              event.createdAt
                            ).toLocaleDateString(
                              "sv-SE",
                              {
                                day: "numeric",
                                month: "short"
                              }
                            )
                          : ""}
                      </span>

                      <span>
                        ✓ {Number(event.confirmationCount) || 0}
                      </span>

                      <span>
                        ○ {Number(event.observationCount) || 0}
                      </span>

                    </div>

                  </div>

                </button>

              ))}

            </div>

          )}

        </section>


        


      </div>

    </main>
  );

}


export default Profile;