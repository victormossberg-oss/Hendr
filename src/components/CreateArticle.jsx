import { useRef, useState } from "react";
import { API_URL } from "../config";
import {
  ArrowLeft,
  ArrowRight,
  X,
  MapPin,
  Navigation,
  Flame,
  CarFront,
  Shield,
  Cloud,
  CircleAlert,
  Sparkles,
  MoreHorizontal,
  Plus,
  Camera,
  Image as ImageIcon,
  Play,
} from "lucide-react";

const CATEGORIES = [
  { name: "Händelser", Icon: CircleAlert },
  { name: "Nöje", Icon: Sparkles },
  { name: "Annat", Icon: MoreHorizontal },
];

function CreateArticle({ onBack, onPublished, editEvent }) {
  const [step, setStep] = useState(1);

  const [title, setTitle] = useState(editEvent?.title || "");
const [lead, setLead] = useState(editEvent?.description || "");
const [category, setCategory] = useState(
  editEvent?.category || "Händelser"
);

  const [locationName, setLocationName] = useState(
  editEvent?.location || ""
);
const [latitude, setLatitude] = useState(
  editEvent?.latitude ?? ""
);
const [longitude, setLongitude] = useState(
  editEvent?.longitude ?? ""
);
const [locationStatus, setLocationStatus] = useState(
  editEvent?.location || "Ingen plats vald"
);

  const [media, setMedia] = useState(() => {
  if (!editEvent?.imageUrl) return [];

  return [
    {
      url: editEvent.imageUrl,
      type: "image",
      file: null,
      existing: true,
    },
  ];
});
  const [mediaMenuOpen, setMediaMenuOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const photoInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  function handleMediaChange(event) {
    const files = Array.from(event.target.files || []);

    if (!files.length) return;

    const newMedia = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      type: file.type.startsWith("video/")
        ? "video"
        : "image",
    }));

    setMedia((current) => [
      ...current,
      ...newMedia,
    ]);

    setMediaMenuOpen(false);

    event.target.value = "";
  }

  function removeMedia(index) {
    setMedia((current) => {
      const item = current[index];

      if (item?.url?.startsWith("blob:")) {
  URL.revokeObjectURL(item.url);
}

      return current.filter(
        (_, i) => i !== index
      );
    });
  }

  function getCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationStatus(
        "Din webbläsare stödjer inte plats."
      );
      return;
    }

    setLocationStatus("Hämtar din position...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        setLatitude(lat);
        setLongitude(lng);

        try {
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=sv`
          );

          if (!response.ok) {
            throw new Error();
          }

          const data = await response.json();

          const locality = data.locality;
          const city = data.city;

          let name =
            locality ||
            city ||
            data.principalSubdivision ||
            "Din nuvarande position";

          if (
            locality &&
            city &&
            locality !== city
          ) {
            name = `${locality}, ${city}`;
          }

          setLocationName(name);
          setLocationStatus(name);
        } catch {
          setLocationName("Din nuvarande position");
          setLocationStatus(
            "Din nuvarande position"
          );
        }
      },
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

  function nextStep() {
    if (step === 1) {
      if (!title.trim() || !lead.trim()) {
        return;
      }

      setStep(2);
      return;
    }

    if (step === 2) {
      setStep(3);
      return;
    }
  }

  function previousStep() {
    if (step === 1) {
      onBack?.();
      return;
    }

    if (step === 2) {
      setStep(1);
      return;
    }

    if (step === 3) {
      setStep(2);
    }
  }

  async function handlePublish() {
    if (publishing) return;

    const token = localStorage.getItem("hendr_token");

    if (!token) {
      alert("Du måste vara inloggad för att publicera en artikel.");
      return;
    }

    if (!title.trim() || !lead.trim()) {
      alert("Fyll i rubrik och ingress innan du publicerar.");
      setStep(1);
      return;
    }

    setPublishing(true);

    try {
      const formData = new FormData();

      formData.append("title", title.trim());
      formData.append("description", lead.trim());
      formData.append("category", category);
      formData.append("status", "Aktiv");

      if (locationName.trim()) {
        formData.append("location", locationName.trim());
      }

      if (latitude !== "" && latitude != null) {
        formData.append("latitude", latitude);
      }

      if (longitude !== "" && longitude != null) {
        formData.append("longitude", longitude);
      }

      // Events har just nu stöd för en huvudbild.
      // Vi använder första bilden som artikelns huvudbild.
      const mainImage = media.find(
        (item) => item.type === "image" && item.file
      );

      if (mainImage) {
        formData.append("image", mainImage.file);
      }

      const response = await fetch(
  editEvent
    ? `${API_URL}/api/events/${editEvent.id}`
    : `${API_URL}/api/events`,
  {
    method: editEvent ? "PUT" : "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  }
);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Kunde inte publicera artikeln."
        );
      }

      // App kan använda detta för att uppdatera feeden direkt.
      if (editEvent) {
  onPublished?.(data);
} else {
  setSubmitted(true);
}
    } catch (error) {
      console.error("Fel vid publicering av artikel:", error);
      alert(error.message || "Kunde inte publicera artikeln.");
    } finally {
      setPublishing(false);
    }
  }

    if (submitted) {
    return (
      <main className="create-article-page">
        <div className="article-submitted-screen">
          <div className="article-submitted-icon">
            ✓
          </div>

          <h1>Artikeln har skickats för granskning</h1>

          <p>
            Tack för ditt bidrag!
          </p>

          <p>
            Din artikel granskas just nu av HENDR.
            Den publiceras när den har godkänts.
          </p>

          <button
            type="button"
            className="article-publish-button"
            onClick={onBack}
          >
            Till startsidan
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="create-article-page">
      <div className="create-article-container">

        {/* TOPBAR */}

        <div className="create-article-topbar">
          <button
            type="button"
            className="create-article-back"
            onClick={previousStep}
            aria-label="Tillbaka"
          >
            <ArrowLeft size={25} />
          </button>

          <button
            type="button"
            className="create-article-close"
            onClick={onBack}
            aria-label="Stäng"
          >
            <X size={26} />
          </button>
        </div>

        {/* STEPPER */}

        <div className="article-stepper">

          {[
            ["1", "Innehåll"],
            ["2", "Plats & media"],
            ["3", "Publicera"],
          ].map(([number, label], index) => {
            const stepNumber = index + 1;
            const active =
              stepNumber <= step;

              {publishing && (
  <div className="article-publishing-overlay">
    <div className="article-publishing-modal">
      <div className="article-publishing-spinner" />

      <strong>Publicerar artikel...</strong>

      <span>Det här kan ta några sekunder.</span>
    </div>
  </div>
)}

            return (
              <div
                className="article-step-item"
                key={number}
              >

                <div
                  className={`article-step-circle ${
                    active ? "active" : ""
                  }`}
                >
                  {number}
                </div>

                <span
                  className={
                    active
                      ? "active"
                      : ""
                  }
                >
                  {label}
                </span>

                {stepNumber < 3 && (
                  <div
                    className={`article-step-line ${
                      stepNumber < step
                        ? "active"
                        : ""
                    }`}
                  />
                )}

              </div>
            );
          })}

        </div>

        {/* STEG 1 */}

        {step === 1 && (
          <section className="article-step-content">

            <h1>{editEvent ? "Redigera din artikel" : "Skriv din artikel"}</h1>

            <p className="article-step-subtitle">
              Berätta vad som händer. Ju mer tydlig
              information, desto bättre.
            </p>

            <label
              className="article-form-label"
              htmlFor="article-title"
            >
              Rubrik <span>*</span>
            </label>

            <input
              id="article-title"
              className="article-input"
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              placeholder="Kort och tydlig rubrik..."
            />

            <label
              className="article-form-label"
              htmlFor="article-lead"
            >
              Innehåll <span>*</span>
            </label>

            <textarea
              id="article-lead"
              className="article-textarea"
              value={lead}
              onChange={(event) =>
                setLead(event.target.value)
              }
              placeholder="Sammanfatta det viktigaste på några meningar..."
              rows={4}
            />

            <div className="article-form-label">
              Kategori <span>*</span>
            </div>

            <div className="create-article-category-grid">

              {CATEGORIES.map(
                ({ name, Icon }) => (
                  <button
                    key={name}
                    type="button"
                    className={`create-article-category ${
                      category === name
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      setCategory(name)
                    }
                  >
                    <Icon size={23} />
                    <span>{name}</span>
                  </button>
                )
              )}

            </div>

            <button
              type="button"
              className="article-next-button"
              onClick={nextStep}
              disabled={
                !title.trim() ||
                !lead.trim()
              }
            >
              <span>Nästa steg</span>
              <ArrowRight size={21} />
            </button>

          </section>
        )}

        {/* STEG 2 */}

        {step === 2 && (
          <section className="article-step-content">

            <h1>Plats</h1>

            <p className="article-step-subtitle">
              Var har det hänt?
            </p>

            <button
  type="button"
  className="article-current-location"
  onClick={getCurrentLocation}
>
  <Navigation size={20} />

  <span>
    Använd min nuvarande plats
  </span>
</button>

            <div className="article-map-placeholder">
              <div className="article-map-grid" />

              <div className="article-map-pin">
                <MapPin
                  size={44}
                  fill="currentColor"
                />
              </div>
            </div>
            <div className="article-selected-location">
  <div>
    <MapPin size={20} />

    <strong>
      {locationStatus || "Ingen plats vald"}
    </strong>
  </div>
</div>

            <h2 className="article-media-heading">
              Bilder
            </h2>

            <p className="article-media-subtitle">
              Lägg till bilder eller video (valfritt)
            </p>

            <div className="article-media-grid">

              {media.map((item, index) => (
                <div
                  className="article-media-item"
                  key={item.url}
                >
                  {item.type === "video" ? (
                    <>
                      <video
                        src={item.url}
                      />
                      <div className="article-video-icon">
                        <Play
                          size={20}
                          fill="currentColor"
                        />
                      </div>
                    </>
                  ) : (
                    <img
                      src={item.url}
                      alt=""
                    />
                  )}

                  <button
                    type="button"
                    className="article-remove-media"
                    onClick={() =>
                      removeMedia(index)
                    }
                  >
                    <X size={15} />
                  </button>
                </div>
              ))}

              <div className="article-add-media-wrap">

                <button
                  type="button"
                  className="article-add-media"
                  onClick={() =>
                    setMediaMenuOpen(
                      (open) => !open
                    )
                  }
                >
                  <Plus size={31} />
                  <span>Lägg till</span>
                </button>

                {mediaMenuOpen && (
                  <div className="article-media-menu">

                    <button
                      type="button"
                      onClick={() =>
                        cameraInputRef.current?.click()
                      }
                    >
                      <Camera size={19} />
                      Ta bild
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        photoInputRef.current?.click()
                      }
                    >
                      <ImageIcon size={19} />
                      Välj foto
                    </button>

                  </div>
                )}

              </div>

            </div>

            <input
              ref={photoInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              hidden
              onChange={handleMediaChange}
            />

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={handleMediaChange}
            />

            <button
              type="button"
              className="article-next-button"
              onClick={nextStep}
            >
              <span>Nästa steg</span>
              <ArrowRight size={21} />
            </button>

          </section>
        )}

        {/* STEG 3 / GRANSKA */}

        {step === 3 && (
          <section className="article-step-content article-review">

            <h1>Granska din artikel</h1>

            <p className="article-step-subtitle">
              Se till att allt ser rätt ut innan du
              publicerar.
            </p>

            <div className="article-preview-card">

              <div className="article-preview-image">

                {media.length > 0 ? (
                  media[0].type === "video" ? (
                    <>
                      <video
                        src={media[0].url}
                      />
                      <div className="article-video-icon large">
                        <Play
                          size={22}
                          fill="currentColor"
                        />
                      </div>
                    </>
                  ) : (
                    <img
                      src={media[0].url}
                      alt=""
                    />
                  )
                ) : (
                  <div className="article-preview-no-image">
                    <Camera size={27} />
                  </div>
                )}

              </div>

              <div className="article-preview-info">

                <span className="article-preview-category">
                  {category.toUpperCase()}
                </span>

                <h2>
                  {title ||
                    "Din rubrik"}
                </h2>

                <p>
                  {lead ||
                    "Din ingress visas här."}
                </p>

                <div className="article-preview-location">
                  <MapPin size={18} />

                  <span>
                    {locationName ||
                      "Ingen plats vald"}
                  </span>
                </div>

              </div>

            </div>

            <button
  type="button"
  className="article-publish-button"
  onClick={handlePublish}
  disabled={publishing}
>
  {publishing
    ? "Sparar..."
    : editEvent
      ? "Spara ändringar"
      : "Publicera artikel"}
</button>

                    </section>
        )}

        {publishing && (
          <div className="article-publishing-overlay">
            <div className="article-publishing-modal">
              <div className="article-publishing-spinner" />

              <strong>{editEvent ? "Sparar artikel..." : "Publicerar artikel..."}</strong>

              <span>Det här kan ta några sekunder.</span>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}

export default CreateArticle;