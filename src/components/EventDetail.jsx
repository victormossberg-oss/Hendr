import { useEffect, useState } from "react";
import {
  Check,
  ChevronLeft,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Share2,
  X,
} from "lucide-react";
import { API_URL } from "../config";

function formatRelativeTime(dateValue) {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";

  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "Just nu";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min sedan`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h sedan`;
  return `${Math.floor(seconds / 86400)} d sedan`;
}

function EventDetail({
  event,
  observations,
  onAddObservation,
  onDelete,
  onUserClick,
  onLocationClick,
  onBack,
}) {
  const [confirmed, setConfirmed] = useState(false);
  const [confirmationCount, setConfirmationCount] = useState(
    Number(event.confirmationCount) || 0
  );
  const [confirming, setConfirming] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);

  useEffect(() => {
    setConfirmationCount(Number(event.confirmationCount) || 0);
  }, [event.confirmationCount]);

  useEffect(() => {
  if (!imageOpen) return;

  function handleKeyDown(e) {
    if (e.key === "Escape") {
      setImageOpen(false);
    }
  }

  document.addEventListener(
    "keydown",
    handleKeyDown
  );

  document.body.style.overflow = "hidden";

  return () => {
    document.removeEventListener(
      "keydown",
      handleKeyDown
    );

    document.body.style.overflow = "";
  };
}, [imageOpen]);

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

  async function handleConfirm() {
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
    } catch (error) {
      console.error("Fel vid bekräftelse:", error);
      alert(error.message);
    } finally {
      setConfirming(false);
    }
  }

  async function handleShare() {
    const shareData = {
      title: event.title,
      text: event.description || `Händelse på HENDR: ${event.title}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        alert("Länken har kopierats.");
      }
    } catch (error) {
      if (error?.name !== "AbortError") {
        console.error("Kunde inte dela händelsen:", error);
      }
    }
  }

  function handleDelete() {
    setMenuOpen(false);

    if (!window.confirm("Vill du ta bort den här händelsen?")) return;
    onDelete?.(event.id);
  }

  const canDelete = (() => {
  const savedUser = localStorage.getItem("hendr_user");
  if (!savedUser) return false;

  try {
    const user = JSON.parse(savedUser);

    return (
      String(user.userid) === String(event.userid) ||
      user.role === "Admin"
    );
  } catch {
    return false;
  }
})();

  return (
    <main className="event-detail-page">
      <div className="detail-topbar">
        <button
          type="button"
          className="detail-back-button"
          onClick={() => {
            if (onBack) {
              onBack();
              return;
            }
            window.history.back();
          }}
          aria-label="Tillbaka"
        >
          <ChevronLeft size={27} />
        </button>

        <div className="detail-menu-wrap">
          <button
            type="button"
            className="detail-menu-button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Fler alternativ"
          >
            <MoreHorizontal size={24} />
          </button>

          {menuOpen && (
            <div className="detail-menu">
              {canDelete && (
                <button type="button" onClick={handleDelete}>
                  Ta bort händelse
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div
  className={`detail-hero ${event.imageUrl ? "has-image" : ""}`}
  onClick={() => {
    if (event.imageUrl) {
      setImageOpen(true);
    }
  }}
  role={event.imageUrl ? "button" : undefined}
  tabIndex={event.imageUrl ? 0 : undefined}
  onKeyDown={(e) => {
    if (
      event.imageUrl &&
      (e.key === "Enter" || e.key === " ")
    ) {
      setImageOpen(true);
    }
  }}
  aria-label={
    event.imageUrl
      ? "Förstora bilden"
      : undefined
  }
>
  {event.imageUrl ? (
    <img src={event.imageUrl} alt="" />
  ) : (
    <div className="detail-hero-placeholder" />
  )}

  
</div>
  {imageOpen && event.imageUrl && (
  <div
    className="image-lightbox"
    onClick={() => setImageOpen(false)}
    role="dialog"
    aria-modal="true"
    aria-label="Förstorad bild"
  >
    <button
      type="button"
      className="image-lightbox-close"
      onClick={(e) => {
        e.stopPropagation();
        setImageOpen(false);
      }}
      aria-label="Stäng bild"
    >
      <X size={30} />
    </button>

    <img
      src={event.imageUrl}
      alt={event.title || ""}
      className="image-lightbox-image"
      onClick={(e) => e.stopPropagation()}
    />
  </div>
  
)}
<section className="detail-content">

  <div className="detail-meta">
    <span className="detail-category">
      <span className="detail-category-icon">
        {event.category === "Brand" ? "🔥" : "•"}
      </span>
      {event.category || "Annat"}
    </span>

    <span className="detail-time">
      {formatRelativeTime(event.createdAt)}
    </span>
  </div>

  <h1>{event.title}</h1>

  {event.location && (
    <button
      type="button"
      className="detail-location-row"
      onClick={() => onLocationClick?.(event)}
    >
      <MapPin size={20} />
      <span>{event.location}</span>
    </button>
  )}

  {event.username && (
    <div className="detail-created-by">
      <span>Skapad av</span>
      <button
        type="button"
        onClick={() =>
          onUserClick?.(
            event.userid ?? event.userID
          )
        }
      >
        {event.username}
      </button>
    </div>
  )}

  <div className="detail-stat-row">
          <button
            type="button"
            className={`detail-stat confirmation-detail-stat ${confirmed ? "confirmed" : ""}`}
            onClick={handleConfirm}
            disabled={confirming}
          >
            <span className="detail-stat-icon check-icon">
              <Check size={19} strokeWidth={3} />
            </span>
            <strong>{confirmationCount}</strong>
            <span>bekräftelser</span>
          </button>

          <div className="detail-stat">
            <MessageCircle className="detail-stat-symbol" size={28} />
            <strong>{Number(event.observationCount) || observations?.length || 0}</strong>
            <span>observationer</span>
          </div>

          
        </div>

        <div className="detail-description-section">
          <h2>Beskrivning</h2>
          <p>{event.description}</p>
        </div>

        {event.latitude != null && event.longitude != null && (
  <div
  className="detail-map-placeholder"
  onClick={() => onLocationClick?.(event)}
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      onLocationClick?.(event);
    }
  }}
  aria-label={`Visa ${event.location || "platsen"} på kartan`}
>
  <div className="detail-map-grid" />

  <div className="detail-map-label">
    <MapPin size={18} />
    {event.location || "Plats"}
  </div>

  <div className="detail-map-pin" />
</div>
)}

        <div className="latest-observations">
          <div className="latest-observations-heading">
            <h2>Senaste observationer</h2>
            {observations?.length > 0 && (
              <button type="button" onClick={onAddObservation}>
                Lägg till
              </button>
            )}
          </div>

          {observations?.length ? (
            <div className="observation-list">
              {observations.map((observation) => (
                <article className="observation-item" key={observation.id}>
                  <div className="observation-item-top">
                    <button
  type="button"
  className="observation-user"
  onClick={() =>
    onUserClick?.(
      observation.userID ?? observation.userid
    )
  }
>
  {observation.username || "Användare"}
</button>
                    <span>{formatRelativeTime(observation.createdAt)}</span>
                  </div>
                  <p>{observation.description}</p>
                  {observation.imageUrl && (
                    <img src={observation.imageUrl} alt="" />
                  )}
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-observations">
              <p>Inga observationer ännu.</p>
              <button type="button" onClick={onAddObservation}>
                Lägg till observation
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

export default EventDetail;
