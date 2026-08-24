import { useEffect, useState } from "react";
import { API_URL } from "../config";

function Profile({
  user
}) {

  const [events, setEvents] =
    useState([]);

  const [loadingEvents, setLoadingEvents] =
    useState(true);

  const [observations, setObservations] =
    useState([]);

  const [loadingObservations, setLoadingObservations] =
    useState(true);


  // =========================
  // HÄMTA MINA HÄNDELSER
  // =========================

  useEffect(() => {

    async function fetchMyEvents() {

      try {

        const token =
          localStorage.getItem(
            "hendr_token"
          );


        if (!token) {
          return;
        }


        const response =
          await fetch(
            `${API_URL}/api/users/me/events`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`
              }
            }
          );


        if (!response.ok) {

          throw new Error(
            "Kunde inte hämta dina händelser"
          );

        }


        const data =
          await response.json();


        setEvents(data);


      } catch (error) {

        console.error(
          "Fel vid hämtning av mina händelser:",
          error
        );


      } finally {

        setLoadingEvents(false);

      }

    }


    fetchMyEvents();

  }, []);


  // =========================
  // HÄMTA MINA OBSERVATIONER
  // =========================

  useEffect(() => {

    async function fetchMyObservations() {

      try {

        const token =
          localStorage.getItem(
            "hendr_token"
          );


        if (!token) {
          return;
        }


        const response =
          await fetch(
            `${API_URL}/api/users/me/observations`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`
              }
            }
          );


        if (!response.ok) {

          throw new Error(
            "Kunde inte hämta dina observationer"
          );

        }


        const data =
          await response.json();


        setObservations(data);


      } catch (error) {

        console.error(
          "Fel vid hämtning av mina observationer:",
          error
        );


      } finally {

        setLoadingObservations(false);

      }

    }


    fetchMyObservations();

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
  // RENDER
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
            MINA HÄNDELSER
        ========================= */}

        <section className="profile-section">

          <h2>
            Mina händelser
          </h2>


          {loadingEvents ? (

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

                  <div
                    className="profile-event"
                    key={event.id}
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

                  </div>

                )
              )}

            </div>

          )}

        </section>


        {/* =========================
            MINA OBSERVATIONER
        ========================= */}

        <section className="profile-section">

          <h2>
            Mina observationer
          </h2>


          {loadingObservations ? (

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

                  <div
                    className="profile-event"
                    key={observation.id}
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

                  </div>

                )
              )}

            </div>

          )}

        </section>


      </div>

    </main>

  );

}


export default Profile;