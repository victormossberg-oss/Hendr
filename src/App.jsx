import { useState } from "react";

import Feed from "./components/Feed";
import EventDetail from "./components/EventDetail";
import BottomNav from "./components/BottomNav";
import ObservationForm from "./components/ObservationForm";
import "./App.css";

function App() {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showObservationForm, setShowObservationForm] = useState(false);
  const [observations, setObservations] = useState([]);

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

if (selectedEvent) {
  return (
    <EventDetail
  event={selectedEvent}
  observations={observations.filter(
    (observation) =>
      observation.eventID === selectedEvent.id
  )}
  onBack={() => setSelectedEvent(null)}
  onAddObservation={() => setShowObservationForm(true)}
/>
  );
}

  return (
    <>
      <header className="header">
        <div className="logo">hendr</div>

        <div className="search">
          🔍
          <span>Sök efter händelser...</span>
        </div>
      </header>

      <section className="intro">
        <p>Vad händer nära dig?</p>

        <div className="filters">
          <button className="active">Alla</button>
          <button>Nära dig</button>
          <button>Följer</button>
        </div>
      </section>

      <Feed
        onEventClick={(event) => setSelectedEvent(event)}
      />

      <BottomNav />
    </>
  );
}

export default App;