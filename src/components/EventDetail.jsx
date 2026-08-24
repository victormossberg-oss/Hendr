import {
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
  onAddObservation,
  onDelete
}) {

  async function handleDelete() {

  const confirmed =
    window.confirm(
      "Är du säker på att du vill ta bort denna händelse?"
    );

  if (!confirmed) {
    return;
  }


  try {

    const token =
      localStorage.getItem(
        "hendr_token"
      );


    if (!token) {

      alert(
        "Du måste vara inloggad för att ta bort en händelse."
      );

      return;

    }


    const response =
      await fetch(
        `${API_URL}/api/events/${event.id}`,
        {
          method: "DELETE",

          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );


    if (!response.ok) {

      const errorData =
        await response.json()
          .catch(() => null);

      throw new Error(
        errorData?.message ||
        "Kunde inte ta bort händelsen"
      );

    }


    onDelete(event.id);


  } catch (error) {

    console.error(
      "Fel vid borttagning av händelse:",
      error
    );

    alert(
      error.message ||
      "Kunde inte ta bort händelsen."
    );

  }

}
  

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

        const token =
  localStorage.getItem(
    "hendr_token"
  );


if (!token) {

  setConfirmed(false);

  return;

}


const response =
  await fetch(
    `${API_URL}/api/events/${event.id}/confirmation`,
    {
      headers: {
        Authorization:
          `Bearer ${token}`
      }
    }
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


      const token =
  localStorage.getItem(
    "hendr_token"
  );


if (!token) {

  alert(
    "Du måste vara inloggad för att bekräfta en händelse."
  );

  return;

}


const response = await fetch(
  `${API_URL}/api/events/${event.id}/confirm`,
  {
    method: "POST",

    headers: {
      Authorization:
        `Bearer ${token}`
    }
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
          BILD
      ========================= */}

      {event.imageUrl && (

        <div className="detail-image">

          <img
            src={event.imageUrl}
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
  latitude={event.latitude}
  longitude={event.longitude}
  location={event.location}
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
                        src={observation.imageUrl}
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
  onClick={onAddObservation}
>
  + Lägg till observation
</button>

<button
  className="delete-event-button"
  onClick={handleDelete}
>
  Ta bort händelse
</button>


      </div>

    </main>

  );

}


export default EventDetail;