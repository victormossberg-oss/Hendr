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

  function handleCreateEvent(
    newEvent
  ) {

    setEvents((current) => [
      newEvent,
      ...current
    ]);

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
        onCreateEvent={
          handleCreateEvent
        }
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

        onEventClick={
          handleEventClick
        }

        onObservationClick={
          handleObservationClick
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

        onEventClick={
          handleEventClick
        }

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


        onDelete={(eventID) => {

          setEvents((current) =>
            current.filter(
              (event) =>
                event.id !== eventID
            )
          );

          setSelectedEvent(null);

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


          <div className="search">

            🔍

            <span>
              Sök efter händelser...
            </span>

          </div>

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

      <BottomNav

        currentPage={
          currentPage
        }


        onHome={() => {

          console.log(
            "HEM KLICKAD"
          );

          setCreatingEvent(false);
          setSelectedEvent(null);
          setShowObservationForm(false);
          setCurrentPage("home");

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


          // =========================
          // INTE INLOGGAD
          // =========================

          if (!user) {

            setLoginReason(
              "profile"
            );

            setShowLogin(true);

            return;

          }


          // =========================
          // INLOGGAD
          // =========================

          setCurrentPage("profile");

        }}

      />

    </div>

  );

}


export default App;