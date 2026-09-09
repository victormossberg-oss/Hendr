import { Analytics } from "@vercel/analytics/react";
import { useEffect, useState } from "react";
import { API_URL } from "./config";
import MapPage from "./components/MapPage";
import Feed from "./components/Feed";
import EventDetail from "./components/EventDetail";
import ObservationForm from "./components/ObservationForm";
import NewEventForm from "./components/NewEventForm";
import BottomNav from "./components/BottomNav";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import PublicProfile from "./pages/PublicProfile";
import {
  Search,
} from "lucide-react";

import "./App.css";


function App() {

  const [events, setEvents] =
    useState([]);

  const [currentPage, setCurrentPage] =
    useState("home");

  const [selectedEvent, setSelectedEvent] =
    useState(null);

  const [showObservationForm, setShowObservationForm] =
    useState(false);

  const [creatingEvent, setCreatingEvent] =
    useState(false);

  const [observations, setObservations] =
    useState([]);

  const [showLogin, setShowLogin] =
    useState(false);

  const [loginReason, setLoginReason] =
    useState(null);

  const [selectedUserID, setSelectedUserID] =
  useState(null);

  const [eventToEdit, setEventToEdit] = useState(null);


  // =========================
  // INLOGGAD ANVÄNDARE
  // =========================

  const [user, setUser] = useState(() => {

    const savedUser =
      localStorage.getItem("hendr_user");

    return savedUser
      ? JSON.parse(savedUser)
      : null;

  });


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

      setCreatingEvent(true);
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


  // =========================
  // HÄMTA ALLA HÄNDELSER
  // =========================

  useEffect(() => {

    fetch(`${API_URL}/api/events`)
      .then((response) => {

        if (!response.ok) {

          throw new Error(
            "Kunde inte hämta händelser"
          );

        }

        return response.json();

      })

      .then((data) => {

  console.log(
  "Första eventet:",
  data[0]
);

console.log(
  "Username:",
  data[0]?.username
);

  setEvents(data);

})

      .catch((error) => {

        console.error(
          "Fel vid hämtning av events:",
          error
        );

      });

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

    setCreatingEvent(false);
    setShowObservationForm(false);

    setSelectedEvent(event);

    setCurrentPage("home");

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

  let content;


  // =========================
  // LOGIN
  // =========================

  if (showLogin) {

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
  // SKAPA HÄNDELSE
  // =========================

  else if (creatingEvent) {

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

        onEdit={(event) => {
          setEventToEdit(event);
          setSelectedEvent(null);
          setCreatingEvent(true);
        }}

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


        onAddObservation={() => {

          if (!user) {

            setLoginReason(
              "observation"
            );

            setShowLogin(true);

            return;

          }

          setShowObservationForm(
            true
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
  <div className="logo">
    HENDR
  </div>

  <button
    type="button"
    className="header-search-button"
    aria-label="Sök efter händelser"
  >
    <Search size={27} strokeWidth={2} />
  </button>
</header>


        <section className="intro">

          <p>
            Vad händer nära dig?
          </p>


          <div className="filters">

            <button className="active">
              Alla
            </button>

            <button>
              Nära dig
            </button>

            <button>
              Följer
            </button>

          </div>

        </section>


        <Feed

          events={events}

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

      </>

    );

  }


  // =========================
  // APP
  // =========================

  return (

    <div className="app">

      {content}


      {/* =========================
          GLOBAL NAVBAR
      ========================= */}

      {!creatingEvent && (
  <BottomNav

    currentPage={
      currentPage
    }

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

      setCreatingEvent(true);
      setSelectedEvent(null);
      setShowObservationForm(false);
      setCurrentPage("home");
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
)}

    <Analytics />

    </div>

  );

}


export default App;