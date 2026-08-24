import { useEffect, useState } from "react";
import {
  Eye,
  ShieldCheck
} from "lucide-react";

import { API_URL } from "../config";

function EventCard({
  event,
  onClick,
  onConfirmationChange
}) {

  const [confirmed, setConfirmed] =
    useState(false);

  const [confirmationCount, setConfirmationCount] =
    useState(
      Number(event.confirmationCount) || 0
    );

  const [confirming, setConfirming] =
    useState(false);


  // =========================
  // KONTROLLERA BEKRÄFTELSE
  // =========================

  useEffect(() => {

    async function checkConfirmation() {

      try {

        const token =
          localStorage.getItem(
            "hendr_token"
          );


        // =========================
        // INTE INLOGGAD
        // =========================

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

  async function handleConfirm(e) {

    e.stopPropagation();


    if (confirming) {
      return;
    }


    try {

      const token =
        localStorage.getItem(
          "hendr_token"
        );


      // =========================
      // KONTROLLERA LOGIN
      // =========================

      if (!token) {

        alert(
          "Du måste vara inloggad för att bekräfta en händelse."
        );

        return;

      }


      setConfirming(true);


      const response =
        await fetch(
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

        const errorData =
          await response.json()
            .catch(() => null);


        throw new Error(
          errorData?.message ||
          "Kunde inte ändra bekräftelsen"
        );

      }


      const data =
        await response.json();


      console.log(
        "Bekräftelse ändrad:",
        data
      );


      // =========================
      // UPPDATERA STATUS
      // =========================

      setConfirmed(
        data.confirmed
      );


      // =========================
      // UPPDATERA RÄKNARE
      // =========================

      setConfirmationCount(
        (current) =>
          data.confirmed
            ? current + 1
            : Math.max(
                0,
                current - 1
              )
      );


      // =========================
      // SYNKA APP.JSX
      // =========================

      if (onConfirmationChange) {

        onConfirmationChange(
          event.id,
          data.confirmed
        );

      }


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

    <article
      className="event-card"
      onClick={onClick}
    >


      {/* =========================
          EVENT-IKON
      ========================= */}

      <div
        className="event-icon"
        style={{
          backgroundColor:
            `${event.color || "#6c4ce8"}20`,

          color:
            event.color ||
            "#6c4ce8"
        }}
      >
        ●
      </div>


      <div className="event-content">


        {/* =========================
            HEADER
        ========================= */}

        <div className="event-header">

          <span className="event-category">
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

        <h2>
          {event.title}
        </h2>


        {/* =========================
            PLATS
        ========================= */}

        <div className="event-location">

          📍 {event.location || "Okänd plats"}

        </div>


        {/* =========================
            BESKRIVNING
        ========================= */}

        <p>
          {event.description}
        </p>


        {/* =========================
            STATISTIK
        ========================= */}

        <div className="event-stats">


          {/* OBSERVATIONER */}

          <span>

            <Eye />

            {event.observationCount}

          </span>


          {/* BEKRÄFTELSER */}

          <button
            className={`feed-confirmation ${
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

            {confirmationCount}

          </button>


        </div>


      </div>


      {/* =========================
          BILD
      ========================= */}

      {event.imageUrl && (

        <div className="event-image">

          <img
            src={event.imageUrl}
            alt=""
          />

        </div>

      )}


    </article>

  );

}

export default EventCard;