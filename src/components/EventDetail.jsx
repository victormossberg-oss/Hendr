import {
  ArrowLeft,
  Eye,
  ShieldCheck
} from "lucide-react";

import {
  useEffect,
  useState
} from "react";

import { API_URL } from "../config";
import LocationDisplay from "./LocationDisplay";


function EventDetail({
  event,
  observations,
  onBack,
  onAddObservation,
  onConfirmationChange
}) {

  // =========================
  // BEKRÄFTELSE
  // =========================

  const [confirmed, setConfirmed] =
    useState(false);

  const [confirmationCount, setConfirmationCount] =
    useState(
      Number(event.confirmationCount) || 0
    );

  const [confirming, setConfirming] =
    useState(false);


  // =========================
  // KONTROLLERA OM
  // ANVÄNDAREN HAR BEKRÄFTAT
  // =========================

  useEffect(() => {

    async function checkConfirmation() {

      try {

        const response = await fetch(
          `${API_URL}/api/events/${event.id}/confirmation`
        );

        if (!response.ok) {
          throw new Error(
            "Kunde inte kontrollera bekräftelsen"
          );
        }

        const data =
          await response.json();

        setConfirmed(
          data.confirmed
        );

      } catch (error) {

        console.error(
          "Fel vid kontroll av bekräftelse:",
          error
        );

      }

    }

    checkConfirmation();

  }, [event.id]);


  // =========================
  // BEKRÄFTA / TA BORT
  // BEKRÄFTELSE
  // =========================

  async function handleConfirm() {

    if (confirming) {
      return;
    }

    try {

      setConfirming(true);


      const response = await fetch(
        `${API_URL}/api/events/${event.id}/confirm`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            userID: 1
          })
        }
      );


      if (!response.ok) {

        throw new Error(
          "Kunde inte ändra bekräftelsen"
        );

      }


      const data =
        await response.json();


      // =========================
      // UPPDATERA LOKAL STATUS
      // =========================

      setConfirmed(
        data.confirmed
      );


      // =========================
      // UPPDATERA ANTAL
      // =========================

      setConfirmationCount(
        (current) => {

          if (data.confirmed) {

            return current + 1;

          }

          return Math.max(
            0,
            current - 1
          );

        }
      );


      // =========================
      // SYNKA MED APP.JSX
      // =========================

      onConfirmationChange(
        event.id,
        data.confirmed
      );


    } catch (error) {

      console.error(
        "Fel vid ändring av bekräftelse:",
        error
      );

    } finally {

      setConfirming(false);

    }

  }


  return (

    <main className="event-detail">


      {/* =========================
          TILLBAKA
      ========================= */}

      <button
        className="back-button"
        onClick={onBack}
      >

        <ArrowLeft />

        Tillbaka

      </button>


      {/* =========================
          BILD
      ========================= */}

      {event.imageUrl && (

        <div className="detail-image">

          <img
            src={`${API_URL}${event.imageUrl}`}
            alt={event.title}
          />

        </div>

      )}


      <div className="detail-content">


        {/* =========================
            HEADER
        ========================= */}

        <div className="detail-header">

          <span
            className="event-category"
            style={{
              color:
                event.color ||
                "#6c4ce8"
            }}
          >

            {event.category}

          </span>


          <span className="event-time">

            {event.createdAt
              ? new Date(
                  event.createdAt
                ).toLocaleString(
                  "sv-SE"
                )
              : ""}

          </span>

        </div>


        {/* =========================
            TITEL
        ========================= */}

        <h1>
          {event.title}
        </h1>


        {/* =========================
            PLATS
        ========================= */}

        {event.latitude != null &&
          event.longitude != null && (

            <LocationDisplay
              latitude={
                event.latitude
              }
              longitude={
                event.longitude
              }
            />

        )}


        {/* =========================
            BESKRIVNING
        ========================= */}

        <p className="detail-description">

          {event.description}

        </p>


        {/* =========================
            STATISTIK
        ========================= */}

        <div className="detail-stats">


          {/* OBSERVATIONER */}

          <div className="detail-stat">

            <Eye />

            <strong>
              {observations.length}
            </strong>

            <span>

              {observations.length === 1
                ? "observation"
                : "observationer"}

            </span>

          </div>


          {/* BEKRÄFTELSER */}

          <button
            className={`detail-stat confirmation-stat ${
              confirmed
                ? "confirmed"
                : ""
            }`}

            onClick={
              handleConfirm
            }

            disabled={
              confirming
            }

            title={
              confirmed
                ? "Ta bort din bekräftelse"
                : "Bekräfta händelsen"
            }
          >

            <ShieldCheck />

            <strong>
              {confirmationCount}
            </strong>

            <span>

              {confirmationCount === 1
                ? "bekräftelse"
                : "bekräftelser"}

            </span>

          </button>

        </div>


        {/* =========================
            TIDSLINJE
        ========================= */}

        <section className="timeline">


          <h2>
            Tidslinje
          </h2>


          {observations.length === 0 ? (

            <p className="empty-timeline">

              Inga observationer har
              rapporterats ännu.

            </p>

          ) : (

            observations.map(
              (observation) => (

                <div
                  className="timeline-item"
                  key={
                    observation.id
                  }
                >


                  <div className="timeline-dot"></div>


                  <div className="timeline-content">


                    <div className="timeline-meta">

                      <strong>
                        Användare
                      </strong>

                      <span>

                        {observation.createdAt
                          ? new Date(
                              observation.createdAt
                            ).toLocaleString(
                              "sv-SE"
                            )
                          : ""}

                      </span>

                    </div>


                    <p>

                      {
                        observation.description
                      }

                    </p>


                    {/* =========================
                        OBSERVATIONENS BILD
                    ========================= */}

                    {observation.imageUrl && (

                      <img
                        className="observation-image"
                        src={`${API_URL}${observation.imageUrl}`}
                        alt="Bild från observation"
                      />

                    )}

                  </div>

                </div>

              )
            )

          )}

        </section>


        {/* =========================
            LÄGG TILL OBSERVATION
        ========================= */}

        <button
          className="observation-button"
          onClick={
            onAddObservation
          }
        >

          + Lägg till observation

        </button>


      </div>

    </main>

  );

}


export default EventDetail;