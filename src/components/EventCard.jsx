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

        setConfirmed(data.confirmed);

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

      console.log(
        "Bekräftelse ändrad:",
        data
      );


      // Uppdatera lokal status

      setConfirmed(
        data.confirmed
      );


      // Uppdatera lokal räknare

      setConfirmationCount(
        (current) =>
          data.confirmed
            ? current + 1
            : Math.max(
                0,
                current - 1
              )
      );


      // Informera App.jsx

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
          📍 Plats
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
            onClick={handleConfirm}
            disabled={confirming}
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
            src={`${API_URL}${event.imageUrl}`}
            alt=""
          />

        </div>
      )}

    </article>
  );
}

export default EventCard;