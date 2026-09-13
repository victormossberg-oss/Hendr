import { useEffect, useState } from "react";
import { API_URL } from "../config";

function Notifications({
  onEventClick,
  onNotificationRead,
}) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

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
                  {notification.type === "update"
  ? "En artikel du följer har uppdaterats."
  : notification.type === "confirmation"
    ? "Någon har bekräftat din artikel."
    : "Du har en ny notis."}
                </p>

                <small>
                  {new Date(
                    notification.createdAt
                  ).toLocaleString("sv-SE")}
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