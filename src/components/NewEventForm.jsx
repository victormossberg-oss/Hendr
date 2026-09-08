import { useEffect, useRef, useState } from "react";
import {
  CarFront,
  Flame,
  MapPin,
  Navigation,
  MoreHorizontal,
  TriangleAlert,
  Users,
  Camera,
} from "lucide-react";
import { API_URL } from "../config";

const CATEGORIES = [
  { name: "Brand", Icon: Flame },
  { name: "Trafik", Icon: CarFront },
  { name: "Olycka", Icon: TriangleAlert },
  { name: "Event", Icon: Users },
  { name: "Annat", Icon: MoreHorizontal },
];

function NewEventForm({ onCreateEvent }) {
  const [category, setCategory] = useState("Brand");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [locationName, setLocationName] = useState("");
  const [locationStatus, setLocationStatus] = useState(
  "Min nuvarande plats"
);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  async function getLocationName(latitude, longitude) {
    try {
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=sv`
      );

      if (!response.ok) {
        throw new Error("Kunde inte hämta platsnamn.");
      }

      const data = await response.json();

      return (
        data.city ||
        data.locality ||
        data.principalSubdivision ||
        null
      );
    } catch (error) {
      console.error("Kunde inte hämta platsnamn:", error);
      return null;
    }
  }

  async function handlePosition(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    setLatitude(latitude);
    setLongitude(longitude);
    setLocationStatus("Hämtar plats...");

    const locationName = await getLocationName(
      latitude,
      longitude
    );

    setLocationName(locationName || "");

    if (locationName) {
      setLocationStatus(locationName);
    } else {
      setLocationStatus("Din nuvarande position");
    }
  }

  

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function getCurrentLocation() {
    if (!navigator.geolocation) return;

    setLocationStatus("Hämtar din position...");

    navigator.geolocation.getCurrentPosition(
      handlePosition,
      () => {
        setLocationStatus(
          "Kunde inte hämta din position"
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Skriv en rubrik för händelsen.");
      return;
    }

    if (!description.trim()) {
      setError("Beskriv kort vad som händer.");
      return;
    }

    const token = localStorage.getItem("hendr_token");

    if (!token) {
      setError(
        "Du måste vara inloggad för att publicera."
      );
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      formData.append(
        "title",
        title.trim()
      );

      formData.append(
        "description",
        description.trim()
      );

      formData.append(
        "category",
        category
      );

      formData.append(
        "status",
        "Aktiv"
      );

      formData.append(
        "latitude",
        latitude === "" ? "" : latitude
      );

      formData.append(
        "longitude",
        longitude === "" ? "" : longitude
      );

      formData.append(
        "location",
        locationName || ""
      );

      if (image) {
        formData.append(
          "image",
          image
        );
      }

      const response = await fetch(
        `${API_URL}/api/events`,
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${token}`,
          },

          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Kunde inte publicera händelsen."
        );
      }

      onCreateEvent?.(data);

    } catch (error) {
      console.error(
        "Fel vid skapande av händelse:",
        error
      );

      setError(error.message);

    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="new-event-page">
      <form
        className="new-event-form"
        onSubmit={handleSubmit}
      >
        <div className="new-event-topbar">
          <button
            type="button"
            className="new-event-cancel"
            onClick={() => window.history.back()}
          >
            Avbryt
          </button>
        </div>

        <div className="new-event-heading">
          <h1>Vad har du sett?</h1>
          <p>Dela det du ser med andra.</p>
        </div>

        <section
          className="category-grid"
          aria-label="Kategori"
        >
          {CATEGORIES.map(
            ({ name, Icon }) => (
              <button
                key={name}
                type="button"
                className={`category-option ${
                  category === name
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  setCategory(name)
                }
              >
                <Icon
                  size={30}
                  strokeWidth={2.2}
                />
                <span>{name}</span>
              </button>
            )
          )}
        </section>

        <label
          className="form-label"
          htmlFor="event-description"
        >
          Beskriv kort vad som händer
        </label>

        <textarea
          id="event-description"
          value={description}
          onChange={(event) =>
            setDescription(
              event.target.value
            )
          }
          placeholder="T.ex. rök från en byggnad, köer på E4, konsert i parken..."
          rows={3}
          required
        />

        <label
          className="form-label"
          htmlFor="event-title"
        >
          Rubrik
        </label>

        <input
          id="event-title"
          type="text"
          value={title}
          onChange={(event) =>
            setTitle(event.target.value)
          }
          placeholder="T.ex. Brand i byggnad"
          maxLength={100}
          required
        />

        <div className="form-label location-label">
          Plats
        </div>

        <button
          type="button"
          className={`location-row ${
            latitude !== ""
              ? "selected"
              : ""
          }`}
          onClick={getCurrentLocation}
        >
          <Navigation size={24} />

          <span>
            {locationStatus}
          </span>

          <span className="location-change">
            Ändra
          </span>
        </button>

        <input
          ref={fileInputRef}
          className="visually-hidden"
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          style={{ display: "none" }}
        />

        <button
          type="button"
          className={`image-upload-row ${
            previewUrl
              ? "has-image"
              : ""
          }`}
          onClick={() =>
            fileInputRef.current?.click()
          }
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Förhandsvisning"
            />
          ) : (
            <Camera size={27} />
          )}

          <span>
            {previewUrl
              ? "Byt bild"
              : "Lägg till bild (valfritt)"}
          </span>
        </button>

        {error && (
          <p className="form-error">
            {error}
          </p>
        )}

        <button
          className="publish-button"
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Publicerar..."
            : "Publicera"}
        </button>
      </form>
    </main>
  );
}

export default NewEventForm;