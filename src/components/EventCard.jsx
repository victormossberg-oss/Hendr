import { useEffect, useState } from "react";
import {
  Bookmark,
  CarFront,
  Check,
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

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const seconds = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 1000)
  );

  if (seconds < 60) {
    return "Just nu";
  }

  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)} min sedan`;
  }

  if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)} h sedan`;
  }

  if (seconds < 604800) {
    return `${Math.floor(seconds / 86400)} d sedan`;
  }

  return date.toLocaleDateString("sv-SE", {
    day: "numeric",
    month: "short",
  });
}

function EventCard({
  event,
  isFeatured = false,
  onClick,
  onConfirmationChange,
  onUserClick,
}) {
  const [confirmed, setConfirmed] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [following, setFollowing] = useState(false);

  const [confirmationCount, setConfirmationCount] =
    useState(
      Number(event.confirmationCount) || 0
    );

  const [confirming, setConfirming] =
    useState(false);

  const CategoryIcon =
    getCategoryIcon(event.category);

  useEffect(() => {
    setConfirmationCount(
      Number(event.confirmationCount) || 0
    );
  }, [event.confirmationCount]);

  useEffect(() => {
    const token =
      localStorage.getItem("hendr_token");

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

        setConfirmed(
          Boolean(data.confirmed)
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

    useEffect(() => {
    const token =
      localStorage.getItem("hendr_token");

    if (!token) return;

    async function checkFollow() {
      try {
        const response = await fetch(
          `${API_URL}/api/events/${event.id}/follow`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) return;

        const data = await response.json();

        setIsFollowing(
          Boolean(data.following)
        );
      } catch (error) {
        console.error(
          "Fel vid kontroll av följning:",
          error
        );
      }
    }

    checkFollow();
  }, [event.id]);

    async function handleFollow(e) {
    e.stopPropagation();

    const token =
      localStorage.getItem("hendr_token");

    if (!token) {
      alert(
        "Du måste vara inloggad för att följa en artikel."
      );
      return;
    }

    if (following) return;

    setFollowing(true);

    try {
      const response = await fetch(
        `${API_URL}/api/events/${event.id}/follow`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Kunde inte ändra följningen."
        );
      }

      setIsFollowing(
        Boolean(data.following)
      );
    } catch (error) {
      console.error(
        "Fel vid följning:",
        error
      );

      alert(error.message);
    } finally {
      setFollowing(false);
    }
  }

  async function handleConfirmation(e) {
    e.stopPropagation();

    const token =
      localStorage.getItem("hendr_token");

    if (!token) {
      alert(
        "Du måste vara inloggad för att bekräfta en händelse."
      );
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
        throw new Error(
          data.message ||
            "Kunde inte ändra bekräftelsen."
        );
      }

      const nextConfirmed =
        Boolean(data.confirmed);

      setConfirmed(nextConfirmed);

      setConfirmationCount((current) =>
        nextConfirmed
          ? current + 1
          : Math.max(0, current - 1)
      );

      onConfirmationChange?.(
        event.id,
        nextConfirmed
      );
    } catch (error) {
      console.error(
        "Fel vid bekräftelse:",
        error
      );

      alert(error.message);
    } finally {
      setConfirming(false);
    }
  }

  function handleUserClick(e) {
    e.stopPropagation();

    onUserClick?.(event.userid);
  }

  return (
    <article
      className={`news-article ${
        isFeatured
          ? "news-article-featured"
          : "news-article-compact"
      }`}
      onClick={onClick}
    >
      <div className="news-article-image">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt=""
          />
        ) : (
          <div className="news-article-image-placeholder">
            <CategoryIcon size={30} />
          </div>
        )}
      </div>

      <div className="news-article-content">

        <div className="news-article-category">
  <span>
    {event.category || "Annat"}
  </span>
</div>

        <h2 className="news-article-title">
          {event.title}
        </h2>

        {event.description && (
          <p className="news-article-description">
            {event.description}
          </p>
        )}

        <div className="news-article-meta">

          {event.location && (
            <>
              <span className="news-article-location">
                <MapPin size={14} />
                {event.location}
              </span>

              <span className="news-meta-dot">
                ·
              </span>
            </>
          )}

          <span>
            {formatRelativeTime(event.createdAt)}
          </span>

          {event.username && (
            <>
              <span className="news-meta-dot">
                ·
              </span>

              <button
                type="button"
                className="news-article-author"
                onClick={handleUserClick}
              >
                Av {event.username}
              </button>
            </>
          )}

        </div>

        <div className="news-article-footer">

          <button
            type="button"
            className={`news-confirmation ${
              confirmed ? "confirmed" : ""
            }`}
            onClick={handleConfirmation}
            disabled={confirming}
          >
            <span className="news-stat-icon">
              <Check
                size={14}
                strokeWidth={3}
              />
            </span>

            <span>
  {confirmationCount}{" "}
  {confirmationCount === 1
    ? "Bekräftelse"
    : "Bekräftelser"}
</span>

            
          </button>

          <span className="news-stat">
            <MessageCircle size={17} />

            <span>
              {Number(
                event.observationCount
              ) || 0}
            </span>

            <span>
              uppdateringar
            </span>
          </span>

          <button
  type="button"
  className={`news-bookmark ${
    isFollowing ? "following" : ""
  }`}
  onClick={handleFollow}
  disabled={following}
  aria-label={
    isFollowing
      ? "Sluta följa artikel"
      : "Följ artikel"
  }
>
  <Bookmark
    size={20}
    fill={isFollowing ? "currentColor" : "none"}
  />
</button>

        </div>
      </div>
    </article>
  );
}

export default EventCard;