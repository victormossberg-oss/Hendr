import { useEffect, useRef, useState } from "react";
import {
  Bookmark,
  Check,
  ChevronLeft,
  MapPin,
  MoreHorizontal,
  Send,
  ShieldCheck,
  X,
  Plus,
  Camera,
  Image as ImageIcon,
} from "lucide-react";
import { API_URL } from "../config";

function formatRelativeTime(dateValue) {
  if (!dateValue) return "";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const seconds = Math.max(
    0,
    Math.floor(
      (Date.now() - date.getTime()) / 1000
    )
  );

  if (seconds < 60) {
    return "Just nu";
  }

  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)} min sedan`;
  }

  if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)} h sedan`;
  }

  if (seconds < 604800) {
    return `${Math.floor(seconds / 86400)} d sedan`;
  }

  return date.toLocaleDateString("sv-SE", {
    day: "numeric",
    month: "short",
  });
}

function getInitials(username) {
  if (!username) return "A";

  return username
    .slice(0, 2)
    .toUpperCase();
}

function EventDetail({
  event,
  observations,
  onDelete,
  onEdit,
  onUserClick,
  onLocationClick,
  onBack,
  onObservationAdded,
}) {
  const [confirmed, setConfirmed] =
    useState(false);

  const [confirmationCount, setConfirmationCount] =
    useState(
      Number(event.confirmationCount) || 0
    );

  const [confirming, setConfirming] =
    useState(false);

  const [menuOpen, setMenuOpen] =
    useState(false);

  const [imageOpen, setImageOpen] =
    useState(false);

const [updateText, setUpdateText] = useState("");
const [updateImage, setUpdateImage] = useState(null);
const [updateImagePreview, setUpdateImagePreview] = useState("");
const [updateOpen, setUpdateOpen] = useState(false);
const [updateSubmitting, setUpdateSubmitting] = useState(false);
const [photoMenuOpen, setPhotoMenuOpen] = useState(false);

const updateInputRef = useRef(null);
const photoInputRef = useRef(null);
const cameraInputRef = useRef(null);

  useEffect(() => {
    setConfirmationCount(
      Number(event.confirmationCount) || 0
    );
  }, [event.confirmationCount]);

  useEffect(() => {
    const token =
      localStorage.getItem("hendr_token");

    if (!token) return;

    async function checkConfirmation() {
      try {
        const response = await fetch(
          `${API_URL}/api/events/${event.id}/confirmation`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) return;

        const data =
          await response.json();

        setConfirmed(
          Boolean(data.confirmed)
        );
      } catch (error) {
        console.error(
          "Fel vid kontroll av bekräftelse:",
          error
        );
      }
    }

    checkConfirmation();
  }, [event.id]);

  useEffect(() => {
    if (!imageOpen) return;

    function handleKeyDown(e) {
      if (e.key === "Escape") {
        setImageOpen(false);
      }
    }

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    document.body.style.overflow =
      "hidden";

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown
      );

      document.body.style.overflow =
        "";
    };
  }, [imageOpen]);

  async function handleConfirm() {
    const token =
      localStorage.getItem("hendr_token");

    if (!token) {
      alert(
        "Du måste vara inloggad för att bekräfta en händelse."
      );
      return;
    }

    if (confirming) return;

    setConfirming(true);

    try {
      const response = await fetch(
        `${API_URL}/api/events/${event.id}/confirm`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Kunde inte ändra bekräftelsen."
        );
      }

      const nextConfirmed =
        Boolean(data.confirmed);

      setConfirmed(nextConfirmed);

      setConfirmationCount(
        (current) =>
          nextConfirmed
            ? current + 1
            : Math.max(0, current - 1)
      );
    } catch (error) {
      console.error(
        "Fel vid bekräftelse:",
        error
      );

      alert(error.message);
    } finally {
      setConfirming(false);
    }
  }

  function openUpdateComposer() {
  const token =
    localStorage.getItem("hendr_token");

  if (!token) {
    alert(
      "Du måste vara inloggad för att lägga till en uppdatering."
    );
    return;
  }

  setUpdateOpen(true);

  setTimeout(() => {
    updateInputRef.current?.focus();
  }, 50);
}


function handleUpdateImage(event) {
  const file = event.target.files?.[0];

  if (!file) return;

  setUpdateImage(file);

  const previewUrl =
    URL.createObjectURL(file);

  setUpdateImagePreview(previewUrl);

  setPhotoMenuOpen(false);
  setUpdateOpen(true);
}


function removeUpdateImage() {
  setUpdateImage(null);
  setUpdateImagePreview("");

  if (photoInputRef.current) {
    photoInputRef.current.value = "";
  }

  if (cameraInputRef.current) {
    cameraInputRef.current.value = "";
  }
}


async function handleSubmitUpdate() {
  const token =
    localStorage.getItem("hendr_token");

  if (!token) {
    alert(
      "Du måste vara inloggad för att lägga till en uppdatering."
    );
    return;
  }

  if (
    !updateText.trim() &&
    !updateImage
  ) {
    return;
  }

  if (updateSubmitting) return;

  setUpdateSubmitting(true);

  try {
    const formData = new FormData();

    formData.append(
      "eventID",
      event.id
    );

    formData.append(
      "description",
      updateText.trim()
    );

    if (updateImage) {
      formData.append(
        "image",
        updateImage
      );
    }

    const response = await fetch(
      `${API_URL}/api/observations`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }
    );

    const data =
      await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Kunde inte lägga till uppdateringen."
      );
    }

    setUpdateText("");
    setUpdateImage(null);
    setUpdateImagePreview("");
    setUpdateOpen(false);

    onObservationAdded?.(data);

  } catch (error) {
    console.error(
      "Fel vid skapande av uppdatering:",
      error
    );

    alert(error.message);
  } finally {
    setUpdateSubmitting(false);
  }
}

  function handleDelete() {
    setMenuOpen(false);

    if (
      !window.confirm(
        "Vill du ta bort den här händelsen?"
      )
    ) {
      return;
    }

    onDelete?.(event.id);
  }

  const canDelete = (() => {
    const savedUser =
      localStorage.getItem("hendr_user");

    if (!savedUser) return false;

    try {
      const user =
        JSON.parse(savedUser);

      return (
        String(user.userid) ===
          String(event.userid) ||
        user.role === "Admin"
      );
    } catch {
      return false;
    }
  })();

  return (
    <main className="article-page">

      {/* =================================
          HERO
          ================================= */}

      <div className="article-hero">

        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt=""
            onClick={() =>
              setImageOpen(true)
            }
          />
        ) : (
          <div className="article-hero-placeholder" />
        )}

        <div className="article-topbar">

          <button
            type="button"
            className="article-circle-button"
            onClick={() => {
              if (onBack) {
                onBack();
                return;
              }

              window.history.back();
            }}
            aria-label="Tillbaka"
          >
            <ChevronLeft size={28} />
          </button>

          <div className="article-topbar-right">

            <button
              type="button"
              className="article-circle-button"
              aria-label="Spara artikel"
            >
              <Bookmark size={22} />
            </button>

            <div className="article-menu-wrap">

              <button
                type="button"
                className="article-circle-button"
                onClick={() =>
                  setMenuOpen(
                    (open) => !open
                  )
                }
                aria-label="Fler alternativ"
              >
                <MoreHorizontal size={24} />
              </button>

              {menuOpen && (
  <div className="article-menu">

    {canDelete && (
      <>
        <button
  type="button"
  onClick={() => {
    setMenuOpen(false);
    onEdit?.(event);
  }}
>
  Redigera artikel
</button>

        <button
          type="button"
          onClick={handleDelete}
        >
          Ta bort artikel
        </button>
      </>
    )}

  </div>
)}

            </div>

          </div>
        </div>
      </div>


      {/* =================================
          ARTIKEL
          ================================= */}

      <article className="article-body">

        <div className="article-category">
          {event.category || "Annat"}
        </div>

        <h1>
          {event.title}
        </h1>


        {/* PLATS + FÖRFATTARE */}

        <div className="article-byline">

          {event.location && (
            <button
              type="button"
              className="article-location"
              onClick={() =>
                onLocationClick?.(event)
              }
            >
              <MapPin size={17} />
              <span>
                {event.location}
              </span>
            </button>
          )}

          {event.username && (
            <button
              type="button"
              className="article-author"
              onClick={() =>
                onUserClick?.(
                  event.userid ??
                    event.userID
                )
              }
            >
              <span className="article-avatar">
                {getInitials(
                  event.username
                )}
              </span>

              <span>
                Av {event.username}
              </span>

              <span className="article-dot">
                ·
              </span>

              <span>
                {formatRelativeTime(
                  event.createdAt
                )}
              </span>
            </button>
          )}

        </div>


        {/* TEXT */}

        <div className="article-text">

          <p>
            {event.description}
          </p>

        </div>


        {/* =================================
            BEKRÄFTELSE
            ================================= */}

        <button
          type="button"
          className={`article-confirmation-box ${
            confirmed ? "confirmed" : ""
          }`}
          onClick={handleConfirm}
          disabled={confirming}
        >

          <span className="article-confirmation-shield">
            <ShieldCheck
              size={25}
              strokeWidth={2.5}
            />
          </span>

          <span className="article-confirmation-text">
            <strong>
              {confirmationCount}{" "}
              {confirmationCount === 1
                ? "person"
                : "personer"}{" "}
              har bekräftat
            </strong>

            <span>
              att händelsen pågår
            </span>
          </span>

          <ChevronLeft
            className="article-confirmation-arrow"
            size={25}
          />

        </button>


        {/* =================================
            UPPDATERINGAR
            ================================= */}

        <section className="article-updates">

          <div className="article-updates-header">

            <h2>
              Uppdateringar
            </h2>

            <span className="article-updates-count">
              {observations?.length || 0}
            </span>

          </div>


          {observations?.length > 0 ? (
            <div className="article-update-list">

              {observations.map(
                (observation) => (
                  <article
                    className="article-update"
                    key={observation.id}
                  >

                    <div className="article-update-avatar">
                      {getInitials(
                        observation.username
                      )}
                    </div>

                    <div className="article-update-content">

                      <div className="article-update-meta">

                        <button
                          type="button"
                          onClick={() =>
                            onUserClick?.(
                              observation.userID ??
                                observation.userid
                            )
                          }
                        >
                          {observation.username ||
                            "Användare"}
                        </button>

                        <span>
                          ·
                        </span>

                        <span>
                          {formatRelativeTime(
                            observation.createdAt
                          )}
                        </span>

                      </div>

                      <p>
                        {observation.description}
                      </p>

                      {observation.imageUrl && (
                        <img
                          src={
                            observation.imageUrl
                          }
                          alt=""
                        />
                      )}

                    </div>

                  </article>
                )
              )}

            </div>
          ) : (
            <p className="article-no-updates">
              Inga uppdateringar ännu.
            </p>
          )}


          {/* LÄGG TILL UPPDATERING */}

<div
  className={`article-update-composer ${
    updateOpen ? "open" : ""
  }`}
>

  {!updateOpen ? (

    <button
      type="button"
      className="article-add-update"
      onClick={openUpdateComposer}
    >
      <span className="article-add-update-icon">
        +
      </span>

      <span>
        Lägg till en uppdatering...
      </span>
    </button>

  ) : (

    <>

      <div className="article-update-input-row">

        <textarea
          ref={updateInputRef}
          value={updateText}
          onChange={(e) =>
            setUpdateText(e.target.value)
          }
          placeholder="Vad händer nu?"
          rows={1}
        />

        <button
          type="button"
          className="article-update-send"
          onClick={handleSubmitUpdate}
          disabled={
            updateSubmitting ||
            (!updateText.trim() &&
              !updateImage)
          }
          aria-label="Skicka uppdatering"
        >
          <Send size={19} />
        </button>

      </div>


      {updateImagePreview && (
        <div className="article-update-image-preview">

          <img
            src={updateImagePreview}
            alt=""
          />

          <button
            type="button"
            onClick={removeUpdateImage}
            aria-label="Ta bort bild"
          >
            <X size={17} />
          </button>

        </div>
      )}


      <div className="article-update-tools">

        <div className="article-photo-wrap">

          <button
            type="button"
            className="article-photo-button"
            onClick={() =>
              setPhotoMenuOpen(
                (open) => !open
              )
            }
            aria-label="Lägg till foto"
          >
            <Plus size={20} />
          </button>


          {photoMenuOpen && (
            <div className="article-photo-menu">

              <button
                type="button"
                onClick={() =>
                  cameraInputRef.current?.click()
                }
              >
                <Camera size={19} />
                <span>
                  Ta bild
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  photoInputRef.current?.click()
                }
              >
                <ImageIcon size={19} />
                <span>
                  Välj foto
                </span>
              </button>

            </div>
          )}

        </div>


        <button
          type="button"
          className="article-update-cancel"
          onClick={() => {
            setUpdateOpen(false);
            setUpdateText("");
            removeUpdateImage();
            setPhotoMenuOpen(false);
          }}
        >
          Avbryt
        </button>

      </div>


      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={handleUpdateImage}
      />


      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={handleUpdateImage}
      />

    </>

  )}

</div>

        </section>

      </article>


      {/* =================================
          LIGHTBOX
          ================================= */}

      {imageOpen &&
        event.imageUrl && (
          <div
            className="image-lightbox"
            onClick={() =>
              setImageOpen(false)
            }
            role="dialog"
            aria-modal="true"
            aria-label="Förstorad bild"
          >

            <button
              type="button"
              className="image-lightbox-close"
              onClick={(e) => {
                e.stopPropagation();
                setImageOpen(false);
              }}
              aria-label="Stäng bild"
            >
              <X size={30} />
            </button>

            <img
              src={event.imageUrl}
              alt={
                event.title || ""
              }
              className="image-lightbox-image"
              onClick={(e) =>
                e.stopPropagation()
              }
            />

          </div>
        )}

    </main>
  );
}

export default EventDetail;