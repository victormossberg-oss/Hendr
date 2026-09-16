import { useEffect, useRef, useState } from "react";
import {
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  Flag,
  MapPin,
  MoreHorizontal,
  Send,
  ShieldCheck,
  MessageCircle,
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
  onEdit,
  onUserClick,
  onLocationClick,
  onBack,
  onObservationAdded,
  onObservationDeleted,
  onDelete,
}) {
  const [confirmed, setConfirmed] =
    useState(false);

  const [confirmationCount, setConfirmationCount] =
    useState(
      Number(event.confirmationCount) || 0
    );

  const [confirming, setConfirming] =
    useState(false);

  const [updatesOpen, setUpdatesOpen] =
    useState(false);

  const [menuOpen, setMenuOpen] =
    useState(false);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportType, setReportType] = useState("event");
  const [reportObservationID, setReportObservationID] = useState(null);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const [imageOpen, setImageOpen] =
    useState(false);

  const [isFollowing, setIsFollowing] = useState(false);

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
  const token = localStorage.getItem("hendr_token");

  if (!token) return;

  async function loadFollowStatus() {
    try {
      const response = await fetch(
        `${API_URL}/api/events/${event.id}/follow`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) return;

      const data = await response.json();

      setIsFollowing(Boolean(data.following));
    } catch (error) {
      console.error(
        "Fel vid hämtning av följstatus:",
        error
      );
    }
  }

  loadFollowStatus();
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

  async function handleFollow() {
  const token = localStorage.getItem("hendr_token");

  if (!token) {
    alert("Du måste vara inloggad för att följa en artikel.");
    return;
  }

  try {
    const response = await fetch(
      `${API_URL}/api/events/${event.id}/follow`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "Kunde inte ändra följstatus."
      );
    }

    setIsFollowing(Boolean(data.following));
  } catch (error) {
    console.error(
      "Fel vid ändring av följstatus:",
      error
    );

    alert(error.message);
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

async function handleDeleteUpdate(observationID) {
  const token = localStorage.getItem("hendr_token");

  if (!token) {
    alert("Du måste vara inloggad.");
    return;
  }

  if (
    !window.confirm(
      "Vill du ta bort den här uppdateringen?"
    )
  ) {
    return;
  }

  try {
    const response = await fetch(
      `${API_URL}/api/observations/${observationID}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Kunde inte ta bort uppdateringen."
      );
    }

    onObservationDeleted?.(observationID);
  } catch (error) {
    console.error(
      "Fel vid borttagning av uppdatering:",
      error
    );

    alert(error.message);
  }
}

async function handleSubmitReport() {
  const token = localStorage.getItem("hendr_token");

  if (!token) {
    alert("Du måste vara inloggad för att rapportera en artikel.");
    return;
  }

  if (!reportReason) {
    alert("Välj en anledning.");
    return;
  }

  if (reportSubmitting) return;

  setReportSubmitting(true);

  try {
    const response = await fetch(
      `${API_URL}/api/reports`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
  ...(reportType === "event"
    ? { eventID: event.id }
    : { observationID: reportObservationID }),
  reason: reportReason,
  description: reportDescription.trim(),
}),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Kunde inte skicka anmälan."
      );
    }

   setReportOpen(false);
setReportType("event");
setReportObservationID(null);
setReportReason("");
setReportDescription("");

    alert("Tack! Din anmälan har skickats.");
  } catch (error) {
    console.error(
      "Fel vid anmälning av artikel:",
      error
    );

    alert(error.message);
  } finally {
    setReportSubmitting(false);
  }
}

  function handleDelete() {
    setMenuOpen(false);

    if (
      !window.confirm(
        "Vill du ta bort den här artikeln?"
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
  className={`article-circle-button ${
    isFollowing ? "following" : ""
  }`}
  onClick={handleFollow}
  aria-label={
    isFollowing
      ? "Sluta följa artikel"
      : "Följ artikel"
  }
>
  <Bookmark
    size={22}
    fill={isFollowing ? "currentColor" : "none"}
  />
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
    <button
  type="button"
  onClick={() => {
  setMenuOpen(false);
  setReportType("event");
  setReportObservationID(null);
  setReportOpen(true);
}}
>
  
  Anmäl artikel
</button>

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

  <div className="article-info-top">
    <div className="article-category">
      {event.category || "Annat"}
    </div>

    <button
      type="button"
      className={`article-confirm ${
        confirmed ? "confirmed" : ""
      }`}
      onClick={handleConfirm}
      disabled={confirming}
      aria-label={
        confirmed
          ? "Ta bort din bekräftelse"
          : "Bekräfta artikeln"
      }
    >
      <ShieldCheck
        size={21}
        strokeWidth={2.4}
      />

      <span>
        {confirmationCount}{" "}
        {confirmationCount === 1
          ? "Bekräftelse"
          : "Bekräftelser"}
      </span>
    </button>
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

        <div className="article-actions">
          <button
            type="button"
            className="article-updates-toggle"
            onClick={() =>
              setUpdatesOpen(
                (open) => !open
              )
            }
            aria-expanded={updatesOpen}
          >
            <MessageCircle
              size={21}
              strokeWidth={2.2}
            />

            <span>
              {observations?.length || 0} Uppdateringar
            </span>
          </button>
        </div>

        {/* =================================
            UPPDATERINGAR{/* =================================
    UPPDATERINGAR
    ================================= */}

{updatesOpen && (
  <section className="article-updates">

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


    {/* BEFINTLIGA UPPDATERINGAR */}

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

  <button
  type="button"
  className="article-update-report"
  onClick={() => {
    setReportType("observation");
    setReportObservationID(observation.id);
    setReportOpen(true);
  }}
  aria-label="Anmäl uppdatering"
>
  <Flag size={14} />
</button>

  {(() => {
    const savedUser =
      localStorage.getItem("hendr_user");

    if (!savedUser) return null;

    try {
      const user =
        JSON.parse(savedUser);

      if (
  user.role !== "Admin" &&
  String(user.userid) !==
    String(
      observation.userID ??
        observation.userid
    )
) {
  return null;
}

      return (
        <button
          type="button"
          className="article-update-delete"
          onClick={() =>
            handleDeleteUpdate(
              observation.id
            )
          }
          aria-label="Ta bort uppdatering"
        >
          <X size={14} />
        </button>
      );
    } catch {
      return null;
    }
  })()}

  
</div>


                <p>
                  {observation.description}
                </p>


                {observation.imageUrl && (
                  <img
                    src={observation.imageUrl}
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

  </section>
)}


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
{reportOpen && (
  <div className="report-overlay">
    <div className="report-dialog">
      <h2>
  {reportType === "event"
    ? "Anmäl artikel"
    : "Anmäl uppdatering"}
</h2>

      {reportType === "event"
  ? "Varför vill du anmäla den här artikeln?"
  : "Varför vill du anmäla den här uppdateringen?"}

      <select
        value={reportReason}
        onChange={(e) =>
          setReportReason(e.target.value)
        }
      >
        <option value="">
          Välj anledning
        </option>
        <option value="violence">
          Våldsamt eller grafiskt innehåll
        </option>
        <option value="sexual">
          Sexuellt innehåll
        </option>
        <option value="hate">
          Hat eller trakasserier
        </option>
        <option value="threat">
          Hot eller uppmaning till våld
        </option>
        <option value="self_harm">
          Självskadeinnehåll
        </option>
        <option value="other">
          Annat
        </option>
      </select>

      <textarea
        value={reportDescription}
        onChange={(e) =>
          setReportDescription(e.target.value)
        }
        placeholder="Beskriv gärna problemet..."
        rows={4}
      />

      <div className="report-actions">
        <button
          type="button"
          onClick={() => {
  setReportOpen(false);
  setReportType("event");
  setReportObservationID(null);
  setReportReason("");
  setReportDescription("");
}}
        >
          Avbryt
        </button>

        <button
          type="button"
          onClick={handleSubmitReport}
          disabled={
            reportSubmitting || !reportReason
          }
        >
          {reportSubmitting
            ? "Skickar..."
            : "Skicka anmälan"}
        </button>
      </div>
    </div>
  </div>
)}
    </main>
  );
}

export default EventDetail;