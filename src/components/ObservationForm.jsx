import { useState } from "react";
import { Image } from "lucide-react";
import LocationPicker from "./LocationPicker";
import { API_URL } from "../config";

function ObservationForm({
  event,
  onSubmitObservation
}) {

  const [description, setDescription] =
    useState("");

  const [image, setImage] =
    useState(null);

  const [imageFile, setImageFile] =
    useState(null);

  const [location, setLocation] =
    useState(null);

  const [submitting, setSubmitting] =
    useState(false);


  // =========================
  // BILD
  // =========================

  function handleImageChange(e) {

    const file =
      e.target.files[0];

    if (!file) {
      return;
    }

    const imageUrl =
      URL.createObjectURL(file);

    setImage(imageUrl);
    setImageFile(file);

  }


  // =========================
  // SKAPA OBSERVATION
  // =========================

  async function handleSubmit(e) {

    e.preventDefault();

    if (submitting) {
      return;
    }


    try {

      setSubmitting(true);


      const formData =
        new FormData();


      // =========================
      // HÄNDELSE
      // =========================

      formData.append(
        "eventID",
        event.id
      );


      // =========================
      // BESKRIVNING
      // =========================

      formData.append(
        "description",
        description
      );


      // =========================
      // KOORDINATER
      // =========================

      if (location) {

        formData.append(
          "latitude",
          location.latitude
        );

        formData.append(
          "longitude",
          location.longitude
        );

      }


      // =========================
      // BILD
      // =========================

      if (imageFile) {

        formData.append(
          "image",
          imageFile
        );

      }


      // =========================
      // JWT
      // =========================

      const token =
        localStorage.getItem(
          "hendr_token"
        );


      const response =
        await fetch(
          `${API_URL}/api/observations`,
          {
            method: "POST",

            headers: {

              Authorization:
                `Bearer ${token}`

            },

            body: formData

          }
        );


      if (!response.ok) {

        const errorData =
          await response.json()
            .catch(() => null);

        throw new Error(
          errorData?.message ||
          "Kunde inte skapa observationen"
        );

      }


      const newObservation =
        await response.json();


      console.log(
        "Ny observation:",
        newObservation
      );


      onSubmitObservation(
        newObservation
      );


    } catch (error) {

      console.error(
        "Fel vid skapande av observation:",
        error
      );

      setSubmitting(false);

    }

  }


  return (

    <main className="observation-page">




      <div className="observation-content">


        <span className="observation-category">
  Observation
</span>


        <h1>
          {event.title}
        </h1>


        <p className="observation-intro">
          Vad ser du just nu?
        </p>


        <form
          onSubmit={handleSubmit}
        >


          {/* =========================
              BESKRIVNING
          ========================= */}

          <label htmlFor="description">
            Beskriv vad du observerar
          </label>


          <textarea
            id="description"
            value={description}
            onChange={(e) =>
              setDescription(
                e.target.value
              )
            }
            placeholder="Skriv vad du ser, hör eller upplever..."
            rows="6"
            required
            disabled={submitting}
          />


          {/* =========================
              BILD
          ========================= */}

          <label
            className={`image-upload ${
              submitting
                ? "disabled"
                : ""
            }`}
          >

            {image ? (

              <img
                src={image}
                alt="Förhandsvisning"
              />

            ) : (

              <>
                <Image />

                <span>
                  Lägg till bild
                </span>
              </>

            )}


            <input
              type="file"
              accept="image/*"
              onChange={
                handleImageChange
              }
              style={{ display: "none" }}
              disabled={submitting}
            />

          </label>


          {/* =========================
              PLATS
          ========================= */}

          <label>
            Plats
          </label>


          <LocationPicker
            onLocationChange={(
              newLocation
            ) => {

              if (submitting) {
                return;
              }

              setLocation(
                newLocation
              );

            }}
          />


          {/* =========================
              SKICKA
          ========================= */}

          <button
            type="submit"
            className="submit-observation"
            disabled={submitting}
          >

            {submitting
              ? "Laddar upp..."
              : "Rapportera observation"}

          </button>


        </form>

      </div>

    </main>

  );

}

export default ObservationForm;