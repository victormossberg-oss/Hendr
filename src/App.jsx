import { Analytics } from "@vercel/analytics/react";
import { useEffect, useState, useRef } from "react";
import { API_URL } from "./config";
import MapPage from "./components/MapPage";
import Feed from "./components/Feed";
import AdminDashboard from "./components/AdminDashboard";
import Notifications from "./components/Notifications";
import SearchPage from "./components/SearchPage";
import EventDetail from "./components/EventDetail";
import ObservationForm from "./components/ObservationForm";
import NewEventForm from "./components/NewEventForm";
import CreateArticle from "./components/CreateArticle";
import BottomNav from "./components/BottomNav";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import PublicProfile from "./pages/PublicProfile";
import VerifyEmail from "./pages/VerifyEmail";
import {
  MapPin,
  Search,
} from "lucide-react";

import "./App.css";


function App() {

  const [events, setEvents] = useState([]);
  const [currentEventPage, setCurrentEventPage] = useState(1);
  const [hasMoreEvents, setHasMoreEvents] = useState(true);
  const [profileRefreshKey, setProfileRefreshKey] = useState(0);
  const [achievementPopup, setAchievementPopup] = useState(null);
  const [achievementQueue, setAchievementQueue] = useState([]);
async function checkForNewAchievements() {
  if (!user) return;

  try {
    const token = localStorage.getItem("hendr_token");

    const response = await fetch(
      `${API_URL}/api/users/me/achievements`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Kunde inte hämta badges");
    }

    const achievements = await response.json();

    const unlockedAchievements =
      achievements.filter(
        (achievement) => achievement.unlocked
      );

    const seenAchievementIds = JSON.parse(
      localStorage.getItem(
        "hendr_seen_achievements"
      ) || "[]"
    );

    const newAchievements =
      unlockedAchievements.filter(
        (achievement) =>
          !seenAchievementIds.includes(
            achievement.achievementID
          )
      );

    if (newAchievements.length > 0) {
  const newAchievementIds = newAchievements.map(
    (achievement) => achievement.achievementID
  );

  const updatedSeenAchievementIds = [
    ...seenAchievementIds,
    ...newAchievementIds,
  ];

  localStorage.setItem(
    "hendr_seen_achievements",
    JSON.stringify(updatedSeenAchievementIds)
  );

  setAchievementPopup(newAchievements[0]);
  setAchievementQueue(newAchievements.slice(1));
}
  } catch (error) {
    console.error(
      "Fel vid kontroll av nya badges:",
      error
    );
  }
}


  const [feedFilter, setFeedFilter] = useState("latest");
  const [userLocation, setUserLocation] = useState(null);
  const [locationName, setLocationName] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);

  const [eventsLoading, setEventsLoading] = useState(true);

  const [currentPage, setCurrentPage] =
    useState("home");

  const [unreadNotifications, setUnreadNotifications] =
  useState(0);

  const [selectedEvent, setSelectedEvent] =
    useState(null);

  const [showObservationForm, setShowObservationForm] =
    useState(false);

  const [creatingEvent, setCreatingEvent] =
    useState(false);

  const [creatingArticle, setCreatingArticle] =
    useState(false);

  const [editingEvent, setEditingEvent] = 
    useState(null);

  const [observations, setObservations] =
    useState([]);

  const [showLogin, setShowLogin] =
    useState(false);

  const [loginReason, setLoginReason] =
    useState(null);

  const [selectedUserID, setSelectedUserID] =
  useState(null);

  const [eventToEdit, setEventToEdit] = useState(null);

  const [showBottomNav, setShowBottomNav] = useState(true);

  

useEffect(() => {
  let lastScrollY = window.scrollY;

  const handleScroll = () => {
    const currentScrollY = window.scrollY;

    if (currentScrollY <= 10) {
      setShowBottomNav(true);
    } else if (currentScrollY > lastScrollY) {
      setShowBottomNav(false);
    } else if (currentScrollY < lastScrollY) {
      setShowBottomNav(true);
    }

    lastScrollY = currentScrollY;
  };

  window.addEventListener("scroll", handleScroll, {
    passive: true,
  });

  return () => {
    window.removeEventListener("scroll", handleScroll);
  };
}, []);

    // =========================
  // Hantera sök
  // =========================
    function handleSearch() {
  setCreatingEvent(false);
  setSelectedEvent(null);
  setShowObservationForm(false);
  setCurrentPage("search");
}


  // =========================
  // INLOGGAD ANVÄNDARE
  // =========================

  const [user, setUser] = useState(() => {

  const savedUser =
    localStorage.getItem("hendr_user");

  if (!savedUser || savedUser === "undefined") {
    return null;
  }

  try {
    return JSON.parse(savedUser);
  } catch (error) {
    console.error(
      "Kunde inte läsa sparad användare:",
      error
    );

    localStorage.removeItem("hendr_user");

    return null;
  }

});

useEffect(() => {
  if (!user) return;

  checkForNewAchievements();

  const interval = setInterval(() => {
    checkForNewAchievements();
  }, 10000);

  return () => {
    clearInterval(interval);
  };
}, [user]);

  async function loadUnreadNotifications() {
  if (!user) {
    setUnreadNotifications(0);
    return;
  }

  try {
    const token =
      localStorage.getItem("hendr_token");

    const response = await fetch(
      `${API_URL}/api/notifications`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        "Kunde inte hämta notiser."
      );
    }

    const data = await response.json();

    const unread = data.filter(
      (notification) =>
        !notification.isRead
    ).length;

    setUnreadNotifications(unread);

  } catch (error) {
    console.error(
      "Fel vid hämtning av olästa notiser:",
      error
    );
  }
}

useEffect(() => {
  loadUnreadNotifications();

  const interval = setInterval(
    loadUnreadNotifications,
    30000
  );

  return () => {
    clearInterval(interval);
  };
}, [user]);


  // =========================
  // LOGIN
  // =========================

  function handleLogin(loggedInUser) {

    setUser(loggedInUser);

    setShowLogin(false);



    // =========================
    // LOGIN FRÅN SKAPA HÄNDELSE
    // =========================

    if (
      loginReason === "createEvent"
    ) {

      setCreatingEvent(false);
      setCreatingArticle(true);
      setShowObservationForm(false);
      setSelectedEvent(null);
      setCurrentPage("home");

    }


    // =========================
    // LOGIN FRÅN OBSERVATION
    // =========================

    else if (
      loginReason === "observation"
    ) {

      setCreatingEvent(false);
      setShowObservationForm(true);

    }


    // =========================
    // LOGIN FRÅN PROFIL
    // =========================

    else if (
      loginReason === "profile"
    ) {

      setCreatingEvent(false);
      setShowObservationForm(false);
      setSelectedEvent(null);
      setCurrentPage("profile");

    }


    // =========================
    // VANLIG LOGIN
    // =========================

    else {

      setCreatingEvent(false);
      setShowObservationForm(false);
      setSelectedEvent(null);
      setCurrentPage("home");

    }


    setLoginReason(null);

  }


  // =========================
  // LOGGA UT
  // =========================

  function handleLogout() {

  localStorage.removeItem(
    "hendr_token"
  );

  localStorage.removeItem(
    "hendr_user"
  );


  setUser(null);

  setSelectedEvent(null);

  setShowObservationForm(false);

  setCreatingEvent(false);

  setCurrentPage("home");

  setShowLogin(false);

  setLoginReason(null);

}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Jordens radie i kilometer

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function getUserLocation() {
  if (!navigator.geolocation) {
    alert("Din webbläsare stödjer inte platsåtkomst.");
    return;
  }

  setLocationLoading(true);

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      console.log("Min position:", location);

      setUserLocation(location);

      fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${location.latitude}&longitude=${location.longitude}&localityLanguage=sv`
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error("Kunde inte hitta platsnamn.");
          }
          return response.json();
        })
        .then((data) => {
          const locality =
            data.locality ||
            data.city ||
            data.principalSubdivision ||
            "Min plats";

          const region =
            data.principalSubdivision ||
            "";

          setLocationName(
            region && locality !== region
              ? `${locality}, ${region}`
              : locality
          );
        })
        .catch((error) => {
          console.error(
            "Kunde inte hämta platsnamn:",
            error
          );
          setLocationName("Min plats");
        })
        .finally(() => {
          setLocationLoading(false);
        });
    },
    (error) => {
      console.error("Kunde inte hämta position:", error);

      setLocationLoading(false);

      alert(
        "Vi kunde inte få tillgång till din plats. Kontrollera platsbehörigheter i webbläsaren."
      );
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000,
    }
  );
}

async function refreshFeed() {
  try {
    const response = await fetch(`${API_URL}/api/events`);

    if (!response.ok) {
      throw new Error("Kunde inte uppdatera händelserna.");
    }

    const data = await response.json();
    setEvents(data);
  } catch (error) {
    console.error(
      "Fel vid uppdatering av feeden:",
      error
    );
  }

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

async function loadMoreEvents() {
  const nextPage = currentEventPage + 1;

  try {
    const response = await fetch(
      `${API_URL}/api/events?page=${nextPage}&limit=15`
    );

    if (!response.ok) {
      throw new Error("Kunde inte hämta fler artiklar.");
    }

    const data = await response.json();

    if (data.length < 15) {
  setHasMoreEvents(false);
}

    setEvents((currentEvents) => [
      ...currentEvents,
      ...data,
    ]);

    setCurrentEventPage(nextPage);
  } catch (error) {
    console.error("Kunde inte hämta fler artiklar:", error);
  }
}

const eventsWithDistance = events.map((event) => {
  if (
    !userLocation ||
    event.latitude == null ||
    event.longitude == null
  ) {
    return {
      ...event,
      distance: null,
    };
  }

  const distance = calculateDistance(
    userLocation.latitude,
    userLocation.longitude,
    Number(event.latitude),
    Number(event.longitude)
  );

  return {
    ...event,
    distance,
  };
});

const filteredEvents =
  feedFilter === "nearby" && userLocation
    ? eventsWithDistance
        .filter(
          (event) =>
            event.distance !== null &&
            event.distance <= 10
        )
        .sort(
          (a, b) => a.distance - b.distance
        )
    : feedFilter === "confirmed"
      ? [...events].sort(
          (a, b) =>
            (Number(b.confirmationCount) || 0) -
            (Number(a.confirmationCount) || 0)
        )
      : events;


  // =========================
  // HÄMTA ALLA HÄNDELSER
  // =========================

  useEffect(() => {
  async function loadEvents() {
    const cachedEvents =
      localStorage.getItem("hendr_events");

    if (cachedEvents) {
      try {
        const parsedEvents = JSON.parse(cachedEvents);

        setEvents(parsedEvents);
        setEventsLoading(false);
      } catch (error) {
        console.error(
          "Kunde inte läsa sparade händelser:",
          error
        );

        localStorage.removeItem("hendr_events");
      }
    }

    try {
      const response = await fetch(
  `${API_URL}/api/events?page=1&limit=15`
);

      if (!response.ok) {
        throw new Error(
          "Kunde inte hämta händelserna."
        );
      }

      const data = await response.json();
      setHasMoreEvents(data.length === 15);

      console.log("Första eventet:", data[0]);
      console.log("Username:", data[0]?.username);

      setEvents(data);

      localStorage.setItem(
        "hendr_events",
        JSON.stringify(data)
      );
    } catch (error) {
      console.error(
        "Fel vid hämtning av händelser:",
        error
      );
    } finally {
      setEventsLoading(false);
    }
  }

  loadEvents();
}, []);


  // =========================
  // HÄMTA OBSERVATIONER
  // FÖR VALD HÄNDELSE
  // =========================

  useEffect(() => {

    if (!selectedEvent) {

      setObservations([]);

      return;

    }


    fetch(
      `${API_URL}/api/events/${selectedEvent.id}/observations`
    )

      .then((response) => {

        if (!response.ok) {

          throw new Error(
            "Kunde inte hämta observationer"
          );

        }

        return response.json();

      })

      .then((data) => {

        setObservations(data);

      })

      .catch((error) => {

        console.error(
          "Fel vid hämtning av observationer:",
          error
        );

      });

  }, [selectedEvent]);


  // =========================
  // BEKRÄFTELSE
  // SYNKA FEED + EVENTDETAIL
  // =========================

  function handleConfirmationChange(
    eventID,
    confirmed
  ) {

    setEvents((currentEvents) =>
      currentEvents.map((event) => {

        if (event.id !== eventID) {
          return event;
        }


        const currentCount =
          Number(
            event.confirmationCount
          ) || 0;


        return {

          ...event,

          confirmationCount:
            confirmed
              ? currentCount + 1
              : Math.max(
                  0,
                  currentCount - 1
                )

        };

      })
    );

  }


  // =========================
  // SKAPA NY HÄNDELSE
  // =========================

  async function handleCreateEvent(newEvent) {
  try {
    const response = await fetch(`${API_URL}/api/events`);

    if (!response.ok) {
      throw new Error("Kunde inte uppdatera händelserna.");
    }

    const data = await response.json();

    setEvents(data);
  } catch (error) {
    console.error(
      "Fel vid uppdatering av händelser:",
      error
    );

    // Om hämtningen misslyckas visar vi ändå det nya eventet
    setEvents((current) => [
      newEvent,
      ...current
    ]);
  }

  setCreatingEvent(false);
}


  // =========================
  // ÖPPNA HÄNDELSE
  // =========================

  function handleEventClick(event) {
  console.log("HANDLE EVENT CLICK", event);

  setCreatingEvent(false);
  setShowObservationForm(false);
  setSelectedEvent(event);
  console.log("SETTER SELECTED EVENT", event);
  setCurrentPage("home");
}

  function handleEditEvent(event) {
  setSelectedEvent(null);
  setEditingEvent(event);
  setCreatingArticle(true);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

  function handleLocationClick(event) {
  setSelectedEvent(event);
  setCreatingEvent(false);
  setShowObservationForm(false);
  setCurrentPage("map");
}

  // =========================
// ÖPPNA PUBLIK PROFIL
// =========================

function handleUserClick(userid) {

  setSelectedUserID(userid);

  setSelectedEvent(null);

  setCreatingEvent(false);

  setShowObservationForm(false);

  setCurrentPage("publicProfile");

}


  // =========================
// ÖPPNA HÄNDELSE FRÅN
// EN OBSERVATION
// =========================

async function handleObservationClick(
  observation
) {

  try {

    console.log(
      "Öppnar observation:",
      observation
    );


    const response =
      await fetch(
        `${API_URL}/api/events`
      );


    if (!response.ok) {

      throw new Error(
        "Kunde inte hämta händelser"
      );

    }


    const allEvents =
      await response.json();


    console.log(
      "Observationens eventid:",
      observation.eventid
    );


    const event =
      allEvents.find(
        (item) =>
          String(item.id) ===
          String(observation.eventid)
      );


    if (!event) {

      console.error(
        "Kunde inte hitta händelsen för observationen.",
        {
          observationEventID:
            observation.eventid,

          availableEventIDs:
            allEvents.map(
              (item) => item.id
            )
        }
      );

      return;

    }


    setCreatingEvent(false);

    setShowObservationForm(false);

    setSelectedEvent(event);

    setCurrentPage("home");


  } catch (error) {

    console.error(
      "Fel vid öppning av händelse:",
      error
    );

  }

}


  // =========================
  // INNEHÅLL
  // =========================
console.log("APP RENDER", {
  currentPage,
  selectedEvent,
});

const isVerifyEmailPage =
  window.location.pathname === "/verify-email";

const isLoginPage =
  new URLSearchParams(window.location.search).get("login") === "1";

  let content;

  if (isVerifyEmailPage) {
  content = <VerifyEmail />;
}

else if (isLoginPage && !user) {
  content = (
    <Login
      onLogin={handleLogin}
      onBack={() => {
        setShowLogin(false);
        setLoginReason(null);
      }}
    />
  );
}

  // =========================
  // LOGIN
  // =========================

  else if (showLogin) {

    content = (

      <Login

        onLogin={
          handleLogin
        }

        onBack={() => {

          setShowLogin(false);
          setLoginReason(null);

        }}

      />

    );

  }


  // =========================
  // SKAPA ARTIKEL
  // =========================

  else if (creatingArticle) {

    content = (
      <CreateArticle
  editEvent={editingEvent}
  onBack={() => {
    setCreatingArticle(false);
    setCurrentPage("home");
    setEditingEvent(null);
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }}
  onPublished={async () => {
    await refreshFeed();
    setCreatingArticle(false);
    setSelectedEvent(null);
    setEditingEvent(null);
    setCurrentPage("home");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }}
/>
    );

  }


  // =========================
  // SKAPA HÄNDELSE
  // =========================

  else if (creatingEvent) {

    console.log("CREATING EVENT ÄR TRUE");

  content = (

    <NewEventForm
      eventToEdit={eventToEdit}
      onCreateEvent={handleCreateEvent}

      onUpdateEvent={(data) => {
        setEvents((prev) =>
          prev.map((item) =>
            String(item.id) === String(data.id)
              ? data
              : item
          )
        );

        setSelectedEvent(data);
        setCreatingEvent(false);
        setEventToEdit(null);
        setCurrentPage("home");
      }}

      onBack={() => {
        setCreatingEvent(false);
        setEventToEdit(null);
        setSelectedEvent(null);
        setShowObservationForm(false);
        setCurrentPage("home");

        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }}
    />

  );

}
// =========================
// PUBLIK PROFIL
// =========================
else if (currentPage === "search") {
  content = (
    <SearchPage
      onBack={() => {
        setCurrentPage("home");
      }}
      onEventClick={handleEventClick}
    />
  );
}

else if (
  currentPage === "publicProfile" &&
  selectedUserID
) {

  content = (

    <PublicProfile

      userid={
        selectedUserID
      }

      onEventClick={
        handleEventClick
      }

      onObservationClick={
        handleObservationClick
      }

      onBack={() => {

        setSelectedUserID(null);

        setCurrentPage("home");

      }}

    />

  );

}

  // =========================
  // PROFIL
  // =========================

  else if (
    currentPage === "profile" &&
    user
  ) {

    content = (

      <Profile
  user={user}
  onEventClick={handleEventClick}
  onObservationClick={handleObservationClick}
  onLogout={handleLogout}
  onCreateArticle={() => setCreatingArticle(true)}
  onAdminClick={() => setCurrentPage("admin")}
  profileRefreshKey={profileRefreshKey}
/>

    );

  }

  // =========================
  // ADMIN
  // =========================

  else if (
  currentPage === "admin" &&
  user
) {
  content = (
    <AdminDashboard
      onEventClick={handleEventClick}
    />
  );
}

    // =========================
  // NOTISER
  // =========================

  else if (
    currentPage === "notifications" &&
    user
  ) {

    content = (

     <Notifications
  onEventClick={handleEventClick}
  onNotificationRead={() => {
  loadUnreadNotifications();
}}
/>

    );

  }
  // =========================
// SÖK
// =========================

else if (
  currentPage === "search"
) {
  content = (
    <SearchPage
      onBack={() => {
        setCurrentPage("home");
      }}

      onEventClick={handleEventClick}

      onConfirmationChange={
        handleConfirmationChange
      }
    />
  );
}

  // =========================
  // KARTA
  // =========================

  else if (
    currentPage === "map"
  ) {

    content = (

      <MapPage
  events={events}
  selectedEvent={selectedEvent}
  onEventClick={handleEventClick}
/>

    );

  }


  // =========================
  // OBSERVATION
  // =========================

  else if (
    selectedEvent &&
    showObservationForm
  ) {

    content = (

      <ObservationForm

        event={selectedEvent}

        onSubmitObservation={(
          observation
        ) => {

          setObservations(
            (current) => [
              ...current,
              observation
            ]
          );

          setShowObservationForm(
            false
          );

        }}

      />

    );

  }


  // =========================
  // EVENT DETAIL
  // =========================

  else if (selectedEvent) {

    content = (

      <EventDetail

        event={selectedEvent}

        observations={
          observations
        }

        onEdit={handleEditEvent}

        onUserClick={
          handleUserClick
        }

        onLocationClick={
          handleLocationClick
        }

        onBack={() => {
          setSelectedEvent(null);
          setCurrentPage("home");
        }}


        onObservationAdded={(observation) => {
  setObservations((current) => [
    observation,
    ...current,
  ]);
}}

onObservationDeleted={(observationID) => {
  setObservations((current) =>
    current.filter(
      (observation) =>
        String(observation.id) !==
        String(observationID)
    )
  );
}}


        onDelete={async (eventID) => {
  const token = localStorage.getItem("hendr_token");

  if (!token) {
    alert("Du måste vara inloggad.");
    return;
  }

  try {
    const response = await fetch(
      `${API_URL}/api/events/${eventID}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Kunde inte ta bort händelsen."
      );
    }

    setEvents((current) =>
  current.filter(
    (event) =>
      String(event.id) !== String(eventID)
  )
);

setProfileRefreshKey((current) => current + 1);

setSelectedEvent(null);

    setSelectedEvent(null);
  } catch (error) {
    console.error(
      "Fel vid borttagning av händelse:",
      error
    );

    alert(error.message);
  }
}}

      />

    );

  }


  // =========================
  // FEED
  // =========================

  else {

    content = (

      <>

  <header className="header">
  <button
    type="button"
    className="header-brand"
    aria-label="HENDR"
    onClick={() => {
      setFeedFilter("latest");
      setSelectedEvent(null);
      setCurrentPage("home");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }}
  >
    <img
      src="/hendr-logo-transparent.png"
      alt="HENDR"
      className="header-brand-logo"
    />
  </button>

  <div className="logo">
    HENDR
  </div>

  <button
    type="button"
    className="header-search-button"
    aria-label="Sök efter händelser"
    onClick={handleSearch}
  >
    <Search size={27} strokeWidth={2} />
  </button>
</header>


        <section className="intro">
  <button
    type="button"
    className="feed-location-status"
    onClick={getUserLocation}
    aria-label={
      userLocation
        ? `Aktuell plats: ${locationName || "Min plats"}`
        : "Aktivera min plats"
    }
  >
    <MapPin size={16} strokeWidth={2} />
    <span>
      {locationLoading
        ? "Hämtar din plats..."
        : userLocation
        ? locationName || "Min plats"
        : "Aktivera min plats"}
    </span>
  </button>

  <div className="filters">
  <button
    className={feedFilter === "latest" ? "active" : ""}
    onClick={() => setFeedFilter("latest")}
  >
    Senaste
  </button>

  <button
  className={feedFilter === "nearby" ? "active" : ""}
  onClick={() => {
    setFeedFilter("nearby");
    getUserLocation();
  }}
>
  I närheten
</button>

  <button
    className={feedFilter === "confirmed" ? "active" : ""}
    onClick={() => setFeedFilter("confirmed")}
  >
    Mest bekräftat
  </button>
</div>
</section>


        <Feed

          events={filteredEvents}
          loading={eventsLoading}

          onEventClick={
            handleEventClick
          }

          onConfirmationChange={
            handleConfirmationChange
          }

          onUserClick={
            handleUserClick
          }

        />
        {hasMoreEvents && (
  <button
    type="button"
    className="load-more-button"
    onClick={loadMoreEvents}
  >
    Ladda fler
    <span>↓</span>
  </button>
)}

      </>

    );

  }


  // =========================
  // APP
  // =========================
  if (eventsLoading) {
  return (
    <div className="app-splash">
      <img
        src="/hendr-logo-transparent.png"
        alt="HENDR"
        className="app-splash-icon"
      />

      <div className="app-splash-name">
        HENDR
      </div>

      <div className="app-splash-tagline">
        Händelser i realtid
      </div>
    </div>
  );
}
  
  return (
  <div className="app">

    {achievementPopup && (
      <div className="achievement-popup-overlay">
        <div className="achievement-popup">

          <button
            type="button"
            className="achievement-popup-close"
            onClick={() => {
              if (achievementQueue.length > 0) {
                const [nextAchievement, ...remaining] =
                  achievementQueue;

                setAchievementQueue(remaining);
                setAchievementPopup(nextAchievement);
              } else {
                setAchievementPopup(null);
              }
            }}
            aria-label="Stäng"
          >
            ×
          </button>

          <div className="achievement-popup-icon">
            <span>
              🏆
            </span>
          </div>

          <span className="achievement-popup-label">
            NY BADGE!
          </span>

          <h2>{achievementPopup.name}</h2>

          <p>{achievementPopup.description}</p>

          <strong>
            +{achievementPopup.xpReward} XP
          </strong>

          <button
            type="button"
            className="achievement-popup-button"
            onClick={() => {
              if (achievementQueue.length > 0) {
                const [nextAchievement, ...remaining] =
                  achievementQueue;

                setAchievementQueue(remaining);
                setAchievementPopup(nextAchievement);
              } else {
                setAchievementPopup(null);
              }
            }}
          >
            Snyggt!
          </button>

        </div>
      </div>
    )}

    {content}

   


      {/* =========================
          GLOBAL NAVBAR
      ========================= */}

     {!creatingEvent &&
 !creatingArticle &&
 currentPage !== "search" && (
  <div
    className={
      showBottomNav
        ? "bottom-nav-visible"
        : "bottom-nav-hidden"
    }
  >
    <BottomNav

      currentPage={
        currentPage
      }

      unreadNotifications={unreadNotifications}

      onHome={() => {
        setCreatingEvent(false);
        setSelectedEvent(null);
        setShowObservationForm(false);
        setCurrentPage("home");

        refreshFeed();
      }}

      onMap={() => {
        console.log(
          "KARTA KLICKAD"
        );

        setCreatingEvent(false);
        setSelectedEvent(null);
        setShowObservationForm(false);
        setCurrentPage("map");
      }}

      onCreateEvent={() => {
        if (!user) {
          setLoginReason(
            "createEvent"
          );
          setShowLogin(true);
          return;
        }

        setCreatingEvent(false);
        setCreatingArticle(true);
        setSelectedEvent(null);
        setShowObservationForm(false);
        setCurrentPage("home");
      }}

      onNotifications={() => {

  if (!user) {
    setLoginReason("notifications");
    setShowLogin(true);
    return;
  }

  setCreatingEvent(false);
  setCreatingArticle(false);
  setSelectedEvent(null);
  setShowObservationForm(false);
  setCurrentPage("notifications");

}}

      onProfile={() => {
        setCreatingEvent(false);
        setSelectedEvent(null);
        setShowObservationForm(false);

        if (!user) {
          setLoginReason("profile");
          setShowLogin(true);
          return;
        }

        setCurrentPage("profile");
      }}

    />
  </div>
)}

<Analytics />

</div>

  );
}

export default App;