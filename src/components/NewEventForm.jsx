import { useState } from "react";
import { Image } from "lucide-react";
import LocationPicker from "./LocationPicker";
import { API_URL } from "../config";

function NewEventForm({ onCreateEvent }) {

  const [title, setTitle] =
    useState("");

  const [category, setCategory] =
    useState("Evenemang");

  const [description, setDescription] =
    useState("");

  const [location, setLocation] =
    useState(null);

  const [image, setImage] =
    useState(null);

  const [imageFile, setImageFile] =
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
  // SKAPA HÄNDELSE
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
      // HÄNDELSEDATA
      // =========================

      formData.append(
        "title",
        title
      );

      formData.append(
        "description",
        description
      );

      formData.append(
        "category",
        category
      );

      formData.append(
        "status",
        "Aktiv"
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
      // API
      // =========================

      const token =
        localStorage.getItem(
          "hendr_token"
        );


      const response =
        await fetch(
          `${API_URL}/api/events`,
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
          "Kunde inte skapa händelsen"
        );

      }


      const newEvent =
        await response.json();


      console.log(
        "Ny händelse:",
        newEvent
      );


      onCreateEvent(
        newEvent
      );


    } catch (error) {

      console.error(
        "Fel vid skapande av händelse:",
        error
      );

      setSubmitting(false);

    }

  }


  return (

    <main className="observation-page">

      <div className="observation-content">

        <span className="event-category">
          Ny händelse
        </span>


        <h1>
          Vad händer?
        </h1>


        <p className="observation-intro">
          Skapa en ny händelse som andra
          kan upptäcka.
        </p>


        <form
          onSubmit={handleSubmit}
        >


          {/* =========================
              RUBRIK
          ========================= */}

          <label htmlFor="title">
            Rubrik
          </label>


          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            placeholder="Ex. Livemusik på Almedalen"
            required
            disabled={submitting}
          />


          {/* =========================
              KATEGORI
          ========================= */}

          <label htmlFor="category">
            Kategori
          </label>


          <select
            id="category"
            value={category}
            onChange={(e) =>
              setCategory(e.target.value)
            }
            disabled={submitting}
          >

            <option value="Evenemang">
              Evenemang
            </option>

            <option value="Nöje">
              Nöje
            </option>

            <option value="Sport">
              Sport
            </option>

            <option value="Trafik">
              Trafik
            </option>

            <option value="Natur">
              Natur
            </option>

            <option value="Mat & dryck">
              Mat & dryck
            </option>

            <option value="Övrigt">
              Övrigt
            </option>

          </select>


          {/* =========================
              BESKRIVNING
          ========================= */}

          <label htmlFor="description">
            Beskrivning
          </label>


          <textarea
            id="description"
            value={description}
            onChange={(e) =>
              setDescription(
                e.target.value
              )
            }
            placeholder="Berätta vad som händer..."
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
              SKAPA
          ========================= */}

          <button
            type="submit"
            className="submit-observation"
            disabled={submitting}
          >

            {submitting
              ? "Laddar upp..."
              : "Skapa händelse"}

          </button>


        </form>

      </div>

    </main>

  );
}

export default NewEventForm;