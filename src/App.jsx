import {
  useEffect,
  useState
} from "react";

import { API_URL } from "./config";

import Feed from "./components/Feed";
import EventDetail from "./components/EventDetail";
import ObservationForm from "./components/ObservationForm";
import NewEventForm from "./components/NewEventForm";
import BottomNav from "./components/BottomNav";

import "./App.css";


function App() {

  const [events, setEvents] =
    useState([]);

  const [selectedEvent, setSelectedEvent] =
    useState(null);

  const [
    showObservationForm,
    setShowObservationForm
  ] = useState(false);

  const [
    creatingEvent,
    setCreatingEvent
  ] = useState(false);

  const [
    observations,
    setObservations
  ] = useState([]);


  // =========================
  // HÄMTA ALLA HÄNDELSER
  // =========================

  useEffect(() => {

    fetch(
      `${API_URL}/api/events`
    )

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
  // SYNKA BEKRÄFTELSER
  // MELLAN FEED + EVENTDETAIL
  // =========================

  function handleConfirmationChange(
    eventID,
    confirmed
  ) {

    // =========================
    // UPPDATERA EVENTS
    // =========================

    setEvents(
      (currentEvents) =>
        currentEvents.map(
          (event) => {

            if (
              event.id !== eventID
            ) {
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

          }
        )
    );


    // =========================
    // UPPDATERA VALT EVENT
    // =========================

    setSelectedEvent(
      (currentEvent) => {

        if (
          !currentEvent ||
          currentEvent.id !== eventID
        ) {
          return currentEvent;
        }

        const currentCount =
          Number(
            currentEvent.confirmationCount
          ) || 0;

        return {
          ...currentEvent,

          confirmationCount:
            confirmed
              ? currentCount + 1
              : Math.max(
                  0,
                  currentCount - 1
                )
        };

      }
    );
  }


  // =========================
  // SKAPA NY HÄNDELSE
  // =========================

  if (creatingEvent) {

    return (
      <NewEventForm

        onBack={() =>
          setCreatingEvent(false)
        }

        onCreateEvent={(newEvent) => {

          setEvents(
            (current) => [
              newEvent,
              ...current
            ]
          );

          setCreatingEvent(false);

        }}

      />
    );
  }


  // =========================
  // LÄGG TILL OBSERVATION
  // =========================

  if (
    selectedEvent &&
    showObservationForm
  ) {

    return (
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
  // VISA HÄNDELSE
  // =========================

  if (selectedEvent) {

    return (
      <EventDetail

        event={selectedEvent}

        observations={
          observations
        }

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

        onConfirmationChange={
          handleConfirmationChange
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