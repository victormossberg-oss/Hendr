import { useEffect, useState } from "react";
import { API_URL } from "../config";

function Notifications({
  onEventClick,
  onNotificationRead,
}) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  function timeAgo(date) {
  const seconds = Math.floor(
    (Date.now() - new Date(date).getTime()) / 1000
  );

  if (seconds < 60) {
    return "Precis nu";
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes} min sedan`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours} h sedan`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days} ${days === 1 ? "dag" : "dagar"} sedan`;
  }

  const weeks = Math.floor(days / 7);

  if (weeks < 4) {
    return `${weeks} ${weeks === 1 ? "vecka" : "veckor"} sedan`;
  }

  const months = Math.floor(days / 30);

  if (months < 12) {
    return `${months} ${months === 1 ? "månad" : "månader"} sedan`;
  }

  const years = Math.floor(days / 365);

  return `${years} ${years === 1 ? "år" : "år"} sedan`;
}

  useEffect(() => {
    async function loadNotifications() {
      try {
        const token =
          localStorage.getItem("hendr_token");

        const response = await fetch(
          `${API_URL}/api/notifications`,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            "Kunde inte hämta notiser."
          );
        }

        const data =
          await response.json();

        setNotifications(data);
      } catch (error) {
        console.error(
          "Fel vid hämtning av notiser:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadNotifications();
  }, []);

  if (loading) {
    return (
      <div className="notifications-page">
        <h1>Notiser</h1>
        <p>Laddar...</p>
      </div>
    );
  }

  return (
    <div className="notifications-page">
      <h1>Notiser</h1>

      {notifications.length === 0 ? (
        <p>Du har inga notiser ännu.</p>
      ) : (
        <div className="notifications-list">
          {notifications.map(
            (notification) => (
              <button
                type="button"
                key={notification.id}
                className={
  `notification-item ${
    notification.isRead
      ? ""
      : "unread"
  }`
}
                onClick={async () => {
                  console.log(
                    "NOTIS KLICKAD",
                    notification
                  );

                  if (!notification.eventid) {
                    return;
                  }

                  try {
                    console.log(
                      "SKA HÄMTA EVENTS"
                    );

                    const response =
                      await fetch(
                        `${API_URL}/api/events`
                      );

                    console.log(
                      "SVAR FRÅN EVENTS",
                      response
                    );

                    if (!response.ok) {
                      throw new Error(
                        "Kunde inte hämta artikeln."
                      );
                    }

                    const events =
                      await response.json();

                    console.log(
                      "HÄMTADE ARTIKLAR",
                      events
                    );

                    console.log(
                      "SÖKER EFTER ID",
                      notification.eventid
                    );

                    const event =
                      events.find(
                        (item) =>
                          String(item.id) ===
                          String(
                            notification.eventid
                          )
                      );

                    if (!event) {
  console.error(
    "Kunde inte hitta artikeln:",
    notification.eventid
  );
  return;
}

if (!notification.isRead) {
  try {
    await fetch(
      `${API_URL}/api/notifications/${notification.id}/read`,
      {
        method: "PATCH",
        headers: {
          Authorization:
            `Bearer ${localStorage.getItem("hendr_token")}`,
        },
      }
    );

    setNotifications((current) =>
      current.map((item) =>
        item.id === notification.id
          ? {
              ...item,
              isRead: true,
            }
          : item
      )
    );

    onNotificationRead?.();
  } catch (error) {
    console.error(
      "Kunde inte markera notisen som läst:",
      error
    );
  }
}

onEventClick?.(event);
                  } catch (error) {
                    console.error(
                      "Fel vid öppning av artikel:",
                      error
                    );
                  }
                }}
              >
                <p>
  <strong>
    {notification.actorUsername || "Någon"}
  </strong>{" "}
  {notification.type === "update"
    ? "har uppdaterat en artikel du följer."
    : notification.type === "confirmation"
      ? "har bekräftat din artikel."
      : "Du har en ny notis."}
</p>

                <small>
  {timeAgo(notification.createdAt)}
</small>
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

export default Notifications;