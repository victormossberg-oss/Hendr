import { useState } from "react";
import { ArrowLeft, Image } from "lucide-react";
import LocationPicker from "./LocationPicker";
import { API_URL } from "../config";

function ObservationForm({
  event,
  onBack,
  onSubmitObservation
}) {
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [location, setLocation] = useState(null);

  function handleImageChange(e) {
    const file = e.target.files[0];

    if (!file) {
      return;
    }

    const imageUrl = URL.createObjectURL(file);

    setImage(imageUrl);
    setImageFile(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const formData = new FormData();

      formData.append("userID", "1");

      formData.append(
        "eventID",
        event.id
      );

      formData.append(
        "description",
        description
      );

      if (imageFile) {
        formData.append(
          "image",
          imageFile
        );
      }

      const response = await fetch(
        `${API_URL}/api/observations`,
        {
          method: "POST",
          body: formData
        }
      );

      if (!response.ok) {
        throw new Error(
          "Kunde inte skapa observationen"
        );
      }

      const newObservation =
        await response.json();

      onSubmitObservation(
        newObservation
      );

    } catch (error) {
      console.error(
        "Fel vid skapande av observation:",
        error
      );
    }
  }

  return (
    <main className="observation-page">

      <button
        className="back-button"
        onClick={onBack}
      >
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
            onChange={(e) =>
              setDescription(e.target.value)
            }
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
            onLocationChange={(newLocation) => {
              setLocation(newLocation);
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