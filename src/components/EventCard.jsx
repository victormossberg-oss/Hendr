import { useEffect, useState } from "react";
import {
  CarFront,
  Check,
  ChevronRight,
  Flame,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  TriangleAlert,
  Users,
} from "lucide-react";
import { API_URL } from "../config";

const CATEGORY_ICONS = {
  Brand: Flame,
  Trafik: CarFront,
  Olycka: TriangleAlert,
  Event: Users,
  Annat: MoreHorizontal,
};

function getCategoryIcon(category) {
  return CATEGORY_ICONS[category] || MoreHorizontal;
}

function formatRelativeTime(dateValue) {
  if (!dateValue) return "";

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";

  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));

  if (seconds < 60) return "Just nu";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min sedan`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h sedan`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} d sedan`;

  return date.toLocaleDateString("sv-SE", {
    day: "numeric",
    month: "short",
  });
}

function EventCard({
  event,
  onClick,
  onConfirmationChange,
  onUserClick,
}) {
  const [confirmed, setConfirmed] = useState(false);
  const [confirmationCount, setConfirmationCount] = useState(
    Number(event.confirmationCount) || 0
  );
  const [confirming, setConfirming] = useState(false);

  const CategoryIcon = getCategoryIcon(event.category);

  useEffect(() => {
    setConfirmationCount(Number(event.confirmationCount) || 0);
  }, [event.confirmationCount]);

  useEffect(() => {
    const token = localStorage.getItem("hendr_token");
    if (!token) return;

    async function checkConfirmation() {
      try {
        const response = await fetch(
          `${API_URL}/api/events/${event.id}/confirmation`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) return;

        const data = await response.json();
        setConfirmed(Boolean(data.confirmed));
      } catch (error) {
        console.error("Fel vid kontroll av bekräftelse:", error);
      }
    }

    checkConfirmation();
  }, [event.id]);

  async function handleConfirmation(e) {
    e.stopPropagation();

    const token = localStorage.getItem("hendr_token");

    if (!token) {
      alert("Du måste vara inloggad för att bekräfta en händelse.");
      return;
    }

    if (confirming) return;
    setConfirming(true);

    try {
      const response = await fetch(
        `${API_URL}/api/events/${event.id}/confirm`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Kunde inte ändra bekräftelsen.");
      }

      const nextConfirmed = Boolean(data.confirmed);
      setConfirmed(nextConfirmed);
      setConfirmationCount((current) =>
        nextConfirmed ? current + 1 : Math.max(0, current - 1)
      );

      onConfirmationChange?.(event.id, nextConfirmed);
    } catch (error) {
      console.error("Fel vid bekräftelse:", error);
      alert(error.message);
    } finally {
      setConfirming(false);
    }
  }

  return (
    <article className="event-card" onClick={onClick}>
      <div className="event-card-media">
        {event.imageUrl ? (
          <img src={event.imageUrl} alt="" />
        ) : (
          <div className="event-card-media-placeholder">
            <CategoryIcon size={30} />
          </div>
        )}

        <div className={`event-badge event-badge-${event.category?.toLowerCase()}`}>
          <CategoryIcon size={17} strokeWidth={2.5} />
          <span>{event.category || "Annat"}</span>
        </div>

        <span className="event-time-badge">
          {formatRelativeTime(event.createdAt)}
        </span>
      </div>

      <div className="event-card-body">
        <div className="event-card-heading">
          <div>
  <h2>{event.title}</h2>

  {event.username && (
    <button
      type="button"
      className="event-author"
      onClick={(e) => {
        e.stopPropagation();
        onUserClick?.(event.userid);
      }}
    >
      {event.username}
    </button>
  )}

  {event.location && (
    <div className="event-location">
      <MapPin size={15} />
      <span>{event.location}</span>
    </div>
  )}
</div>
          <ChevronRight className="event-card-chevron" size={22} />
        </div>

        {event.description && (
          <p className="event-description">{event.description}</p>
        )}

        <div className="event-stats">
          <button
            type="button"
            className={`event-confirmation-stat ${confirmed ? "confirmed" : ""}`}
            onClick={handleConfirmation}
            disabled={confirming}
          >
            <span className="confirmation-icon">
              <Check size={15} strokeWidth={3} />
            </span>
            <span>{confirmationCount}</span>
            <span>bekräftelser</span>
          </button>

          <span>
            <MessageCircle size={17} />
            {Number(event.observationCount) || 0} observationer
          </span>
        </div>
      </div>
    </article>
  );
}

export default EventCard;
