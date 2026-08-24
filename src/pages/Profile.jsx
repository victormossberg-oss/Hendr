import { useEffect, useState } from "react";
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

  return (

    <main className="profile-page">

      <div className="profile-content">


        {/* =========================
            PROFILHEADER
        ========================= */}

        <section className="profile-header">

          <div className="profile-avatar">

            {initial}

          </div>


          <h1>

            {user.username}

          </h1>


          <p>

            {user.email}

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
            onClick={() =>
              setShowEvents(true)
            }
          >

            <strong>

              {loading
                ? "–"
                : events.length}

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
            onClick={() =>
              setShowObservations(true)
            }
          >

            <strong>

              {loading
                ? "–"
                : observations.length}

            </strong>


            <span>

              Observationer

            </span>

          </button>


        </section>


        {/* =========================
            KONTO
        ========================= */}

        <section className="profile-section">

          <h2>

            Mitt konto

          </h2>


          <div className="profile-info">

            <div className="profile-info-row">

              <span>

                Konto skapades

              </span>


              <strong>

                {createdDate}

              </strong>

            </div>

          </div>

        </section>


        {/* =========================
            LOGGA UT
        ========================= */}

        <button
          className="logout-button"
          type="button"
          onClick={onLogout}
        >
          Logga ut
        </button>


      </div>

    </main>

  );

}


export default Profile;