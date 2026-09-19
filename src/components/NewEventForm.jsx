import { useEffect, useRef, useState } from "react";
import {
  CarFront,
  Flame,
  MapPin,
  Navigation,
  MoreHorizontal,
  TriangleAlert,
  Users,
  Sparkles,
  Camera,
} from "lucide-react";
import { API_URL } from "../config";

const CATEGORIES = [
  { name: "Händelser", Icon: TriangleAlert },
  { name: "Nöje", Icon: Sparkles },
  { name: "Annat", Icon: MoreHorizontal },
];

function NewEventForm({
  onCreateEvent,
  onUpdateEvent,
  onBack,
  eventToEdit,
}) {
  const [category, setCategory] = useState(
  eventToEdit?.category || "Brand"
);

const [title, setTitle] = useState(
  eventToEdit?.title || ""
);

const [description, setDescription] = useState(
  eventToEdit?.description || ""
);

const [image, setImage] = useState(null);

const [previewUrl, setPreviewUrl] = useState(
  eventToEdit?.imageUrl || ""
);

const [latitude, setLatitude] = useState(
  eventToEdit?.latitude ?? ""
);

const [longitude, setLongitude] = useState(
  eventToEdit?.longitude ?? ""
);

const [locationName, setLocationName] = useState(
  eventToEdit?.location || ""
);
  const [locationStatus, setLocationStatus] = useState(
  eventToEdit?.location || "Min nuvarande plats"
);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  async function getLocationName(latitude, longitude) {
    console.log("GET LOCATION NAME KÖRS", latitude, longitude);
  try {
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=sv`
    );

    if (!response.ok) {
      throw new Error("Kunde inte hämta platsnamn.");
    }

    const data = await response.json();

    console.log("Reverse geocoding:", data);

    const locality = data.locality;
    const city = data.city;

    if (locality && city && locality !== city) {
      return `${locality}, ${city}`;
    }

    return (
      locality ||
      city ||
      data.principalSubdivision ||
      null
    );
  } catch (error) {
    console.error("Kunde inte hämta platsnamn:", error);
    return null;
  }
}

  async function handlePosition(position) {
    console.log("HANDLE POSITION KÖRS");
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
  eventToEdit
    ? `${API_URL}/api/events/${eventToEdit.id}`
    : `${API_URL}/api/events`,
  {
    method: eventToEdit ? "PUT" : "POST",

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

      if (eventToEdit) {
  onUpdateEvent?.(data);
} else {
  onCreateEvent?.(data);
}

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
            onClick={onBack}
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
  required
/>

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

        {!eventToEdit && (
          <div className="moderation-info">
            <strong>
              Artikeln granskas innan publicering
            </strong>

            <p>
              När du skickar in artikeln granskas den först.
              Den publiceras på HENDR när granskningen är klar.
            </p>
          </div>
        )}

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
    ? eventToEdit
      ? "Sparar..."
      : "Publicerar..."
    : eventToEdit
      ? "Spara ändringar"
      : "Publicera"}
</button>
      </form>
    </main>
  );
}

export default NewEventForm;