import { useState } from "react";
import { ArrowLeft, MapPin, Image } from "lucide-react";

function ObservationForm({
  event,
  onBack,
  onSubmitObservation
}) {
  const [description, setDescription] = useState("");

  function handleSubmit(e) {
  e.preventDefault();

  const newObservation = {
    id: Date.now(),
    eventID: event.id,
    description: description,
    createdAt: new Date().toLocaleTimeString("sv-SE", {
      hour: "2-digit",
      minute: "2-digit"
    })
  };

  onSubmitObservation(newObservation);
}

  return (
    <main className="observation-page">

      <button className="back-button" onClick={onBack}>
        <ArrowLeft />
        Tillbaka
      </button>

      <div className="observation-content">

        <span
          className="event-category"
          style={{ color: event.color }}
        >
          Ny observation
        </span>

        <h1>{event.title}</h1>

        <p className="observation-intro">
          Vad ser du just nu?
        </p>

        <form onSubmit={handleSubmit}>

          <label htmlFor="description">
            Beskriv vad du observerar
          </label>

          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Skriv vad du ser, hör eller upplever..."
            rows="6"
            required
          />

          <div className="observation-option">
            <Image />
            <span>Lägg till bild</span>
          </div>

          <div className="observation-location">
            <MapPin />

            <div>
              <strong>Plats</strong>
              <span>{event.location}</span>
            </div>
          </div>

          <button
            type="submit"
            className="submit-observation"
          >
            Rapportera observation
          </button>

        </form>

      </div>

    </main>
  );
}

export default ObservationForm;