import { useEffect, useState } from "react";
import { API_URL } from "./config";
import MapPage from "./components/MapPage";
import Feed from "./components/Feed";
import EventDetail from "./components/EventDetail";
import ObservationForm from "./components/ObservationForm";
import NewEventForm from "./components/NewEventForm";
import BottomNav from "./components/BottomNav";

import "./App.css";

function App() {
  const [events, setEvents] = useState([]);
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
  // =========================

  useEffect(() => {
    if (!selectedEvent) {
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

  function handleCreateEvent(newEvent) {

    setEvents((current) => [
      newEvent,
      ...current
    ]);

    setCreatingEvent(false);
  }


  // =========================
  // INNEHÅLL
  // =========================

  let content;


  // =========================
  // SKAPA HÄNDELSE
  // =========================

  if (creatingEvent) {

    content = (
      <NewEventForm
        onBack={() =>
          setCreatingEvent(false)
        }

        onCreateEvent={
          handleCreateEvent
        }
      />
    );

  }

  else if (currentPage === "map") {

  content = (
    <MapPage
      events={events}

      onEventClick={(event) => {
        setSelectedEvent(event);
        setCurrentPage("home");
      }}
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

        onBack={() =>
          setShowObservationForm(false)
        }

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

        observations={observations}

        onBack={() =>
          setSelectedEvent(null)
        }

        onAddObservation={() =>
          setShowObservationForm(true)
        }

        onConfirmationChange={
          handleConfirmationChange
        }
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

  onEventClick={(event) =>
    setSelectedEvent(event)
  }

  onConfirmationChange={
    handleConfirmationChange
  }
/>

      </>
    );

  }


  return (
    <div className="app">

      {content}


      {/* =========================
          GLOBAL NAVBAR
      ========================= */}

      <BottomNav

  onHome={() => {
    setSelectedEvent(null);
    setShowObservationForm(false);
    setCreatingEvent(false);
    setCurrentPage("home");
  }}


  onMap={() => {
    setSelectedEvent(null);
    setShowObservationForm(false);
    setCreatingEvent(false);
    setCurrentPage("map");
  }}


  onCreateEvent={() => {
    setCurrentPage("home");
    setCreatingEvent(true);
  }}

/>

    </div>
  );
}

export default App;