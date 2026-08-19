import { useState } from "react";
import { ArrowLeft, Image } from "lucide-react";
import LocationPicker from "./LocationPicker";

function ObservationForm({ event, onBack, onSubmitObservation }) {
    const [description, setDescription] = useState("");
    const [image, setImage] = useState(null);
    const [location, setLocation] = useState(null);

    <LocationPicker
  onLocationChange={(newLocation) => {
    setLocation(newLocation);
  }}
/>

    function handleImageChange(e) {
  const file = e.target.files[0];

  if (!file) {
    return;
  }

  const imageUrl = URL.createObjectURL(file);

  setImage(imageUrl);
}

  function handleSubmit(e) {
    e.preventDefault();

    const newObservation = {
  id: Date.now(),
  eventID: event.id,
  username: "Victor",
  description: description,

  latitude: location?.latitude ?? null,
  longitude: location?.longitude ?? null,

  createdAt: new Date().toLocaleTimeString("sv-SE", {
    hour: "2-digit",
    minute: "2-digit"
  }),

  confirmations: 0,
  image: image
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
          Observation
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

         <label className="image-upload">
  {image ? (
    <img
      src={image}
      alt="Förhandsvisning"
    />
  ) : (
    <>
      <Image />
      <span>Lägg till bild</span>
    </>
  )}

  <input
    type="file"
    accept="image/*"
    onChange={handleImageChange}
  />
</label>

          <label>
  Plats
</label>

<LocationPicker
  onLocationChange={(location) => {
    console.log("Observationens plats:", location);
  }}
/>

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