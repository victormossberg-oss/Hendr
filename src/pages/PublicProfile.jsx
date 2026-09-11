import { useEffect, useState } from "react";
import { API_URL } from "../config";

function PublicProfile({
  userid,
  onEventClick,
  onObservationClick,
  onBack
}) {

  const [profile, setProfile] =
    useState(null);

  const [events, setEvents] =
    useState([]);

  const [stats, setStats] =
    useState({
      articleCount: 0,
      confirmationCount: 0,
      updateCount: 0
    });

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [showEvents, setShowEvents] =
    useState(false);


  // =========================
  // HÄMTA PUBLIK PROFILDATA
  // =========================

  useEffect(() => {

    async function fetchProfile() {

      try {

        setLoading(true);
        setError("");

        const [
          profileResponse,
          eventsResponse,
          statsResponse
        ] = await Promise.all([

          fetch(
            `${API_URL}/api/users/${userid}`
          ),

          fetch(
            `${API_URL}/api/users/${userid}/events`
          ),

          fetch(
            `${API_URL}/api/users/${userid}/stats`
          )

        ]);


        if (!profileResponse.ok) {

          throw new Error(
            "Kunde inte hitta användaren."
          );

        }


        if (
          !eventsResponse.ok ||
          !statsResponse.ok
        ) {

          throw new Error(
            "Kunde inte hämta användarens innehåll."
          );

        }


        const profileData =
          await profileResponse.json();

        const eventsData =
          await eventsResponse.json();

        const statsData =
          await statsResponse.json();


        setProfile(
          profileData
        );

        setEvents(
          eventsData
        );

        setStats({

          articleCount:
            Number(
              statsData.articleCount
            ) || 0,

          confirmationCount:
            Number(
              statsData.confirmationCount
            ) || 0,

          updateCount:
            Number(
              statsData.updateCount
            ) || 0

        });


      } catch (error) {

        console.error(
          "Fel vid hämtning av publik profil:",
          error
        );

        setError(
          error.message
        );

      } finally {

        setLoading(false);

      }

    }


    if (userid) {
      fetchProfile();
    }

  }, [userid]);


  // =========================
  // LOADING
  // =========================

  if (loading) {

    return (
      <main className="profile-page">

        <div className="profile-content">

          <div className="profile-empty">
            Hämtar profil...
          </div>

        </div>

      </main>
    );

  }


  // =========================
  // FEL
  // =========================

  if (error || !profile) {

    return (
      <main className="profile-page">

        <div className="profile-content">

          <button
            className="back-button"
            type="button"
            onClick={onBack}
          >
            ← Tillbaka
          </button>


          <div className="profile-empty">

            {error ||
              "Användaren kunde inte hittas."}

          </div>

        </div>

      </main>
    );

  }


  // =========================
  // INITIAL
  // =========================

  const initial =
    profile.username
      ? profile.username
          .charAt(0)
          .toUpperCase()
      : "?";


  // =========================
  // DATUM
  // =========================

  const createdDate =
    profile.createdAt
      ? new Date(
          profile.createdAt
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
  // ALLA ARTIKLAR
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
              {profile.username}s artiklar
            </h1>


            {events.length === 0 ? (

              <div className="profile-empty">

                {profile.username} har inte
                skapat några artiklar ännu.

              </div>

            ) : (

              <div className="profile-article-list">

                {events.map((event) => (

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

                          {event.category ||
                            "Annat"}

                        </div>

                      )}

                    </div>


                    <div className="profile-article-content">

                      <span className="profile-article-category">

                        {event.category ||
                          "Annat"}

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
                          ✓{" "}
                          {Number(
                            event.confirmationCount
                          ) || 0}
                        </span>


                        <span>
                          ○{" "}
                          {Number(
                            event.observationCount
                          ) || 0}
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


  // =========================
  // VANLIG PUBLIK PROFIL
  // =========================

  return (

    <main className="profile-page">

      <div className="profile-content">


        {/* =========================
            TILLBAKA
        ========================= */}

        <button
          className="back-button"
          type="button"
          onClick={onBack}
        >
          ← Tillbaka
        </button>


        {/* =========================
            PROFILHEADER
        ========================= */}

        <section className="profile-header">

          <div className="profile-avatar">
            {initial}
          </div>


          <h1>
            {profile.username}
          </h1>


          {profile.location && (

            <p className="profile-location">
              {profile.location}
            </p>

          )}


          {profile.bio && (

            <p className="profile-bio">
              {profile.bio}
            </p>

          )}

        </section>


        {/* =========================
            STATISTIK
        ========================= */}

        <section className="profile-stats">

          <div className="profile-stat">

            <strong>
              {stats.articleCount}
            </strong>

            <span>
              artiklar
            </span>

          </div>


          <div className="profile-stat">

            <strong>
              {stats.confirmationCount}
            </strong>

            <span>
              bekräftelser
            </span>

          </div>


          <div className="profile-stat">

            <strong>
              {stats.updateCount}
            </strong>

            <span>
              uppdateringar
            </span>

          </div>

        </section>


        {/* =========================
            SENASTE ARTIKLAR
        ========================= */}

        <section className="profile-articles">

          <div className="profile-section-heading">

            <h2>
              {profile.username}s senaste artiklar
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


          {events.length === 0 ? (

            <div className="profile-empty">

              {profile.username} har inte
              skapat några artiklar ännu.

            </div>

          ) : (

            <div className="profile-article-list">

              {events
                .slice(0, 5)
                .map((event) => (

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

                          {event.category ||
                            "Annat"}

                        </div>

                      )}

                    </div>


                    <div className="profile-article-content">

                      <span className="profile-article-category">

                        {event.category ||
                          "Annat"}

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
                          ✓{" "}
                          {Number(
                            event.confirmationCount
                          ) || 0}
                        </span>


                        <span>
                          ○{" "}
                          {Number(
                            event.observationCount
                          ) || 0}
                        </span>

                      </div>

                    </div>

                  </button>

                ))}

            </div>

          )}

        </section>


        {/* =========================
            MEDLEM SEDAN
        ========================= */}

        <p
          style={{
            textAlign: "center",
            marginTop: "28px",
            marginBottom: "10px",
            fontSize: "12px",
            color: "#888"
          }}
        >
          Medlem sedan {createdDate}
        </p>


      </div>

    </main>

  );

}

export default PublicProfile;