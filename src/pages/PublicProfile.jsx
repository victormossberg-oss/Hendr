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

  const [observations, setObservations] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [showEvents, setShowEvents] =
    useState(false);

  const [showObservations, setShowObservations] =
    useState(false);


  // =========================
  // HÄMTA PUBLIK PROFIL
  // =========================

  useEffect(() => {

    async function fetchProfile() {

      try {

        setLoading(true);
        setError("");

        const [
          profileResponse,
          eventsResponse,
          observationsResponse
        ] = await Promise.all([

          fetch(
            `${API_URL}/api/users/${userid}`
          ),

          fetch(
            `${API_URL}/api/users/${userid}/events`
          ),

          fetch(
            `${API_URL}/api/users/${userid}/observations`
          )

        ]);


        if (
          !profileResponse.ok
        ) {

          throw new Error(
            "Kunde inte hitta användaren."
          );

        }


        if (
          !eventsResponse.ok ||
          !observationsResponse.ok
        ) {

          throw new Error(
            "Kunde inte hämta användarens innehåll."
          );

        }


        const profileData =
          await profileResponse.json();

        const eventsData =
          await eventsResponse.json();

        const observationsData =
          await observationsResponse.json();


        setProfile(
          profileData
        );

        setEvents(
          eventsData
        );

        setObservations(
          observationsData
        );


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
  // HÄNDELSER
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

              {profile.username}s händelser

            </h1>


            {events.length === 0 ? (

              <div className="profile-empty">

                {profile.username} har inte
                skapat några händelser ännu.

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
  // OBSERVATIONER
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

              {profile.username}s observationer

            </h1>


            {observations.length === 0 ? (

              <div className="profile-empty">

                {profile.username} har inte
                lagt till några observationer ännu.

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


          <p>

            Medlem sedan{" "}

            {profile.createdAt
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
              : "okänt datum"}

          </p>

        </section>


        {/* =========================
            STATISTIK
        ========================= */}

        <section className="profile-stats">


          {/* =========================
              HÄNDELSER
          ========================= */}

          <button
            className="profile-stat"
            type="button"
            onClick={() => {

              setShowEvents(true);
              setShowObservations(false);

            }}
          >

            <strong>

              {events.length}

            </strong>


            <span>

              Händelser

            </span>

          </button>


          {/* =========================
              OBSERVATIONER
          ========================= */}

          <button
            className="profile-stat"
            type="button"
            onClick={() => {

              setShowObservations(true);
              setShowEvents(false);

            }}
          >

            <strong>

              {observations.length}

            </strong>


            <span>

              Observationer

            </span>

          </button>

        </section>


        {/* =========================
            TOM PROFIL
        ========================= */}

        {events.length === 0 &&
          observations.length === 0 && (

            <div className="profile-empty">

              {profile.username} har ännu inte
              skapat några händelser eller
              observationer.

            </div>

          )}

      </div>

    </main>

  );

}


export default PublicProfile;