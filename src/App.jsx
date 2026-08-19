import { useState } from "react";

import initialEvents from "./data/events";

import Feed from "./components/Feed";
import EventDetail from "./components/EventDetail";
import ObservationForm from "./components/ObservationForm";
import NewEventForm from "./components/NewEventForm";
import BottomNav from "./components/BottomNav";

import "./App.css";

function App() {
  const [events, setEvents] = useState(initialEvents);

  const [selectedEvent, setSelectedEvent] = useState(null);

  const [showObservationForm, setShowObservationForm] =
    useState(false);

  const [creatingEvent, setCreatingEvent] =
    useState(false);

  const [observations, setObservations] =
    useState([]);

  // =========================
  // SKAPA NY HÄNDELSE
  // =========================

  if (creatingEvent) {
    return (
      <NewEventForm
        onBack={() => setCreatingEvent(false)}
        onCreateEvent={(newEvent) => {
          setEvents((current) => [
            newEvent,
            ...current
          ]);

          setCreatingEvent(false);
        }}
      />
    );
  }

  // =========================
  // LÄGG TILL OBSERVATION
  // PÅ BEFINTLIG HÄNDELSE
  // =========================

  if (selectedEvent && showObservationForm) {
    return (
      <ObservationForm
        event={selectedEvent}
        onBack={() => setShowObservationForm(false)}
        onSubmitObservation={(observation) => {
          setObservations((current) => [
            ...current,
            observation
          ]);

          setShowObservationForm(false);
        }}
      />
    );
  }

  // =========================
  // VISA HÄNDELSE
  // =========================

  if (selectedEvent) {
    return (
      <EventDetail
        event={selectedEvent}

        observations={observations.filter(
          (observation) =>
            observation.eventID === selectedEvent.id
        )}

        onBack={() => setSelectedEvent(null)}

        onAddObservation={() =>
          setShowObservationForm(true)
        }
      />
    );
  }

  // =========================
  // HUVUDFEED
  // =========================

  return (
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
      />

      <BottomNav
        onCreateEvent={() =>
          setCreatingEvent(true)
        }
      />
    </>
  );
}

export default App;