import { useEffect, useRef, useState } from "react";
import {
  Edit,
  Settings,
  X,
  ShieldCheck,
  Newspaper,
  FileText,
  MapPin,
  CheckCircle,
  Star,
  MessageCircle,
  Users,
  Compass,
  UserCheck,
  Eye,
  UserPlus,
  Flame,
  Trophy,
  Zap
} from "lucide-react";
import { API_URL } from "../config";

const LEVELS = [
  {
    level: 1,
    title: "Tipster",
    xp: 0,
    nextXp: 50,
  },
  {
    level: 2,
    title: "Fältreporter",
    xp: 50,
    nextXp: 150,
  },
  {
    level: 3,
    title: "Korrespondent",
    xp: 150,
    nextXp: 350,
  },
  {
    level: 4,
    title: "Krönikör",
    xp: 350,
    nextXp: 700,
  },
  {
    level: 5,
    title: "Redaktör",
    xp: 700,
    nextXp: 1500,
  },
  {
    level: 6,
    title: "Veteran",
    xp: 1500,
    nextXp: 3000,
  },
  {
    level: 7,
    title: "HENDR-profil",
    xp: 3000,
    nextXp: null,
  },
];

function getLevelInfo(level, xp) {

  const numericLevel = Number(level);

  const currentLevel =
    LEVELS.find(
      (item) => item.level === numericLevel
    ) || LEVELS[0];

  const nextLevel =
    LEVELS.find(
      (item) => item.level === numericLevel + 1
    );

  return {
  ...currentLevel,
  currentXp: Number(xp) || 0,
  nextXp: nextLevel?.xp ?? null,
  nextTitle: nextLevel?.title ?? null,
};

}

function getAchievementIcon(icon) {
  const icons = {
    first_article: Newspaper,
    reporter: FileText,
    local_reporter: MapPin,
    journalist: Newspaper,

    trusted_source: CheckCircle,
    well_confirmed: CheckCircle,
    top_article: Star,
    local_talk: MessageCircle,

    first_location: MapPin,
    local_expert: Compass,
    explorer: Compass,

    contributor: UserPlus,
    community_builder: Users,
    verifier: UserCheck,
    engaged: Eye,

    on_the_move: Zap,
    regular: Flame,

    first_on_scene: Trophy,
    hendr_pioneer: Star,
    all_round_reporter: Trophy
  };

  return icons[icon] || Trophy;
}

function Profile({
  user,
  onEventClick,
  onObservationClick,
  onLogout,
  onCreateArticle,
  onAdminClick,
  profileRefreshKey,
}) {

  const [events, setEvents] =
    useState([]);

  const [observations, setObservations] =
    useState([]);

  const [followedEvents, setFollowedEvents] =
    useState([]);

  const [articleTab, setArticleTab] = useState("mine");
  const [profileTab, setProfileTab] = useState("articles");

  const [stats, setStats] = useState({
  articleCount: 0,
  confirmationCount: 0,
  updateCount: 0,
  xp: 0,
  level: 1
});

const [achievements, setAchievements] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [showEvents, setShowEvents] =
    useState(false);

  const [showObservations, setShowObservations] =
    useState(false);

  const [showSettings, setShowSettings] =
    useState(false);

  const [editingProfile, setEditingProfile] =
  useState(false);

const [bio, setBio] =
  useState(
    user.bio ||
    "Rapporterar om vad som händer och håller dig uppdaterad."
  );

const [location, setLocation] = useState(
  user.location || ""
);

const [profileImage, setProfileImage] =
  useState(user.profileImageUrl || "");

  const levelInfo = getLevelInfo(
  stats.level,
  Number(stats.xp) || 0
);

const [showXpInfo, setShowXpInfo] = useState(false);

const fileInputRef = useRef(null);

useEffect(() => {
  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem("hendr_token");

      const response = await fetch(
        `${API_URL}/api/auth/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Kunde inte hämta profilen."
        );
      }

      const data = await response.json();

      if (data.user) {
  setBio(data.user.bio || "");
  setLocation(data.user.location || "");
  setProfileImage(data.user.profileImageUrl || "");
}

    } catch (error) {
      console.error(
        "Fel vid hämtning av profil:",
        error
      );
    }
  };

  fetchCurrentUser();
}, []);


  // =========================
  // HÄMTA MINA DATA
  // =========================

  useEffect(() => {

    async function fetchMyData() {

      try {

        const token =
          localStorage.getItem(
            "hendr_token"
          );


        if (!token) {
          return;
        }


        const headers = {
          Authorization:
            `Bearer ${token}`
        };


        // =========================
        // HÄMTA HÄNDELSER
        // =========================

        const eventsResponse =
          await fetch(
            `${API_URL}/api/users/me/events`,
            {
              headers
            }
          );


        if (!eventsResponse.ok) {

          throw new Error(
            "Kunde inte hämta dina händelser"
          );

        }


        const eventsData =
          await eventsResponse.json();


        setEvents(
          eventsData
        );

        // =========================
// HÄMTA FÖLJDA ARTIKLAR
// =========================

const followedResponse =
  await fetch(
    `${API_URL}/api/users/me/follows`,
    {
      headers
    }
  );

if (!followedResponse.ok) {
  throw new Error(
    "Kunde inte hämta följda artiklar"
  );
}

const followedData =
  await followedResponse.json();

setFollowedEvents(
  followedData
);


        // =========================
        // HÄMTA OBSERVATIONER
        // =========================

        const observationsResponse =
          await fetch(
            `${API_URL}/api/users/me/observations`,
            {
              headers
            }
          );


        if (!observationsResponse.ok) {

          throw new Error(
            "Kunde inte hämta dina observationer"
          );

        }


        const observationsData =
          await observationsResponse.json();


        setObservations(
          observationsData
        );

        // =========================
// HÄMTA STATISTIK
// =========================

const statsResponse =
  await fetch(
    `${API_URL}/api/users/me/stats`,
    {
      headers
    }
  );

if (!statsResponse.ok) {
  throw new Error(
    "Kunde inte hämta din statistik"
  );
}

const statsData =
  await statsResponse.json();
  console.log("MIN STATISTIK:", statsData);

setStats({
  articleCount:
    Number(statsData.articleCount) || 0,

  confirmationCount:
    Number(statsData.confirmationCount) || 0,

  updateCount:
    Number(statsData.updatecount) || 0,

  xp:
    Number(statsData.xp) || 0,

  level:
    Number(statsData.level) || 1
});

const achievementsResponse = await fetch(
  `${API_URL}/api/users/me/achievements`,
  {
    headers
  }
);

if (!achievementsResponse.ok) {
  throw new Error(
    "Kunde inte hämta dina badges"
  );
}

const achievementsData =
  await achievementsResponse.json();

setAchievements(achievementsData);

console.log(
  "MINA BADGES:",
  achievementsData
);


      } catch (error) {

        console.error(
          "Fel vid hämtning av profildata:",
          error
        );


      } finally {

        setLoading(false);

      }

    }


    fetchMyData();

  }, [profileRefreshKey]);


  // =========================
  // PROFILDATA
  // =========================

  const initial =
    user.username
      ? user.username
          .charAt(0)
          .toUpperCase()
      : "?";


  const createdDate =
    user.created_at
      ? new Date(
          user.created_at
        ).toLocaleDateString(
          "sv-SE",
          {
            year: "numeric",
            month: "long",
            day: "numeric"
          }
        )
      : "Okänt";


  // =========================
  // MINA HÄNDELSER
  // =========================

  if (showEvents) {

    return (

      <main className="profile-page">

        <div className="profile-content">

          <section className="profile-list-page">

            <button
              className="back-button"
              type="button"
              onClick={() =>
                setShowEvents(false)
              }
            >
              ← Tillbaka
            </button>


            <h1>
              Mina artiklar
            </h1>


            {loading ? (

              <div className="profile-empty">

                Hämtar dina artiklar...

              </div>

            ) : events.length === 0 ? (

              <div className="profile-empty">

                Du har inte skapat några
                artiklar ännu.

              </div>

            ) : (

              <div className="profile-events">

                {events.map(
                  (event) => (

                    <button
                      className="profile-event"
                      key={event.id}
                      type="button"
                      onClick={() =>
                        onEventClick(event)
                      }
                    >

                      <span className="event-category">

                        {event.category}

                      </span>


                      <h3>

                        {event.title}

                      </h3>


                      <p>

                        {event.description}

                      </p>


                      <span className="event-time">

                        {event.createdAt
                          ? new Date(
                              event.createdAt
                            ).toLocaleString(
                              "sv-SE"
                            )
                          : ""}

                      </span>

                    </button>

                  )
                )}

              </div>

            )}

          </section>

        </div>

      </main>

    );

  }


  // =========================
  // MINA OBSERVATIONER
  // =========================

  if (showObservations) {

    return (

      <main className="profile-page">

        <div className="profile-content">

          <section className="profile-list-page">

            <button
              className="back-button"
              type="button"
              onClick={() =>
                setShowObservations(false)
              }
            >
              ← Tillbaka
            </button>


            <h1>
              Mina observationer
            </h1>


            {loading ? (

              <div className="profile-empty">

                Hämtar dina observationer...

              </div>

            ) : observations.length === 0 ? (

              <div className="profile-empty">

                Du har inte lagt till några
                observationer ännu.

              </div>

            ) : (

              <div className="profile-events">

                {observations.map(
                  (observation) => (

                    <button
                      className="profile-event"
                      key={observation.id}
                      type="button"
                      onClick={() =>
                        onObservationClick(
                          observation
                        )
                      }
                    >

                      <span className="event-category">

                        Observation

                      </span>


                      <p>

                        {observation.description}

                      </p>


                      <span className="event-time">

                        {observation.createdAt
                          ? new Date(
                              observation.createdAt
                            ).toLocaleString(
                              "sv-SE"
                            )
                          : ""}

                      </span>

                    </button>

                  )
                )}

              </div>

            )}

          </section>

        </div>

      </main>

    );

  }


   // =========================
  // VANLIG PROFIL
  // =========================

  const articleCount =
  stats.articleCount;

const confirmationCount =
  stats.confirmationCount;

const updateCount =
  stats.updateCount;

  return (
    <main className="profile-page">

      <div className="profile-content">

        {/* =========================
            PROFILHEADER
        ========================= */}

        <section className="profile-header">

  <button
    type="button"
    className="profile-settings-button"
    onClick={() => setShowSettings(true)}
    aria-label="Inställningar"
  >
    <Settings size={21} strokeWidth={1.7} />
  </button>

  <div className="profile-avatar-wrapper">

    <div className="profile-avatar">
  {profileImage ? (
    <img
      src={profileImage}
      alt={`Profilbild för ${user.username}`}
      className="profile-avatar-image"
    />
  ) : (
    initial
  )}
</div>

    <button
  type="button"
  className="profile-avatar-edit"
  aria-label="Ändra profilbild"
  onClick={() => fileInputRef.current?.click()}
>
  +
</button>

<input
  ref={fileInputRef}
  type="file"
  accept="image/*"
  style={{ display: "none" }}
  onChange={async (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    try {
      const token =
        localStorage.getItem("hendr_token");

      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(
        `${API_URL}/api/users/me/profile-image`,
        {
          method: "PUT",
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
            "Kunde inte ladda upp profilbilden."
        );
      }

      setProfileImage(data.profileImageUrl);

    } catch (error) {
      console.error(
        "Fel vid uppladdning av profilbild:",
        error
      );

      alert(error.message);
    }

    e.target.value = "";
  }}
/>

  </div>

  <h1>
    {user.username}
  </h1>

 

 {location && (
  <p className="profile-location">
    {location}
  </p>
)}

  {bio && (
  <p className="profile-bio">
    {bio}
  </p>
)}

</section>

        {showSettings && (
  <div className="profile-settings-overlay">

    <div className="profile-settings-panel">

      <div className="profile-settings-header">

        <h2>
          Inställningar
        </h2>

        <button
          type="button"
          onClick={() => setShowSettings(false)}
          aria-label="Stäng"
        >
          <X size={20} />
        </button>

      </div>

      <button
  type="button"
  className="profile-settings-item"
  onClick={() => {
    setShowSettings(false);
    setEditingProfile(true);
  }}
>
  <Edit size={17} />
  Redigera profil
</button>

{user?.role === "Admin" && (
  <button
    type="button"
    className="profile-settings-item"
    onClick={() => {
      setShowSettings(false);
      onAdminClick();
    }}
  >
    <ShieldCheck size={17} />
    Admin
  </button>
)}

      <button
        type="button"
        className="profile-settings-item profile-settings-logout"
        onClick={onLogout}
      >
        Logga ut
      </button>

    </div>

  </div>
)}

{editingProfile && (
  <section className="profile-edit-panel">

    <div className="profile-edit-header">

      <h2>
        Redigera profil
      </h2>

      <button
        type="button"
        onClick={() => setEditingProfile(false)}
        aria-label="Stäng"
      >
        <X size={20} />
      </button>

    </div>
    <label className="profile-edit-label">
  Plats
  <input
    type="text"
    value={location}
    onChange={(e) => setLocation(e.target.value)}
    maxLength={255}
    placeholder="Exempelvis Stockholm, Sverige"
  />
</label>

    <label className="profile-edit-label">
      Presentation

      <textarea
        value={bio}
        onChange={(e) =>
          setBio(e.target.value)
        }
        maxLength={180}
        placeholder="Berätta kort om dig själv..."
        rows={4}
      />
    </label>

    <div className="profile-edit-counter">
      {bio.length}/180
    </div>

    <button
  type="button"
  className="profile-save-button"
  onClick={async () => {
    try {
      const token = localStorage.getItem("hendr_token");

      const response = await fetch(
        `${API_URL}/api/users/me/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            bio,
            location,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Kunde inte spara profilen."
        );
      }

      setEditingProfile(false);

      console.log("Profil sparad:", data);

    } catch (error) {
      console.error(
        "Fel vid sparande av profil:",
        error
      );

      alert(error.message);
    }
  }}
>
  Spara profil
</button>

  </section>
)}

        {/* =========================
            STATISTIK
        ========================= */}

        <div className="profile-xp">
  <div className="profile-xp-header">
    <div>
      <span className="profile-xp-level">
        Level {levelInfo.level}
      </span>
      <span className="profile-xp-title">
        · {levelInfo.title}
      </span>
    </div>

    <span className="profile-xp-value">
      {levelInfo.nextXp !== null
        ? `${levelInfo.currentXp} / ${levelInfo.nextXp} XP`
        : `${levelInfo.currentXp} XP · Maxnivå`}
    </span>
  </div>

  {levelInfo.nextXp !== null && (
    <div className="profile-xp-bar">
      <div
        className="profile-xp-progress"
        style={{
          width: `${Math.min(
            100,
            Math.max(
              0,
              (levelInfo.currentXp / levelInfo.nextXp) * 100
            )
          )}%`,
        }}
      />
    </div>
  )}

  <div className="profile-xp-subrow">
    <button
      type="button"
      className="profile-xp-toggle"
      onClick={() => setShowXpInfo((current) => !current)}
    >
      <span>Så tjänar du XP</span>
      <span>{showXpInfo ? "−" : "+"}</span>
    </button>

    {levelInfo.nextXp !== null && (
      <div className="profile-xp-next">
        {levelInfo.nextXp - levelInfo.currentXp} XP till{" "}
        {levelInfo.nextTitle}
      </div>
    )}
  </div>

  {showXpInfo && (
    <div className="profile-xp-details">
      <div>
        <strong>+10 XP</strong>
        <span>Skapa en artikel</span>
      </div>
      <div>
        <strong>+5 XP</strong>
        <span>Få en bekräftelse på din artikel</span>
      </div>
      <div>
        <strong>+3 XP</strong>
        <span>Skriva en uppdatering</span>
      </div>
      <div>
        <strong>+1 XP</strong>
        <span>Följa en artikel</span>
      </div>
    </div>
  )}
</div>


        <section className="profile-stats">

          

          <div className="profile-stat">
            <strong>
              {loading ? "–" : articleCount}
            </strong>

            <span>
              artiklar
            </span>
          </div>

          <div className="profile-stat">
            <strong>
              {loading ? "–" : confirmationCount}
            </strong>

            <span>
              bekräftelser
            </span>
          </div>

          <div className="profile-stat">
            <strong>
              {loading ? "–" : updateCount}
            </strong>

            <span>
              uppdateringar
            </span>
          </div>

        </section>


        {/* =========================
            SKAPA ARTIKEL
        ========================= */}

        <button
          type="button"
          className="profile-create-button"
          onClick={onCreateArticle}
        >
          <span>
            +
          </span>

          Skapa ny artikel
        </button>


        {/* =========================
            MINA SENASTE ARTIKLAR
        ========================= */}

        <section className="profile-articles">

          <div className="filters profile-article-tabs">
  <button
    type="button"
    className={profileTab === "articles" ? "active" : ""}
    onClick={() => setProfileTab("articles")}
  >
    Mina artiklar
  </button>

  <button
    type="button"
    className={profileTab === "followed" ? "active" : ""}
    onClick={() => setProfileTab("followed")}
  >
    Följda artiklar
  </button>

  <button
    type="button"
    className={profileTab === "badges" ? "active" : ""}
    onClick={() => setProfileTab("badges")}
  >
    Badges
  </button>
</div>


  {loading ? (
  <div className="profile-empty">
    Hämtar artiklar...
  </div>
) : profileTab === "badges" ? (
  <div className="profile-achievements-list">
  {achievements.map((achievement) => (
    <div
      className="profile-achievement"
      key={achievement.achievementID}
    >
      <div className="profile-achievement-icon">
  {(() => {
    const Icon = getAchievementIcon(achievement.icon);

    return <Icon size={28} strokeWidth={1.8} />;
  })()}
</div>

      <div className="profile-achievement-content">
        <strong>{achievement.name}</strong>

        <p>{achievement.description}</p>

        <span>
  +{achievement.xpReward} XP ·{" "}
  {new Date(achievement.unlockedAt).toLocaleDateString("sv-SE")}
</span>
      </div>
    </div>
  ))}
</div>
) : profileTab === "articles" ? (
  events.length === 0 ? (
    <div className="profile-empty">
      Du har inte skapat några artiklar ännu.
    </div>
  ) : (
    <div className="profile-article-list">
      {events.slice(0, 5).map((event) => (
        <button
          type="button"
          className="profile-article"
          key={event.id}
          onClick={() => onEventClick(event)}
        >
          <div className="profile-article-image">
  {event.imageUrl ? (
    <img
      src={event.imageUrl}
      alt=""
    />
  ) : (
    <div className="profile-article-placeholder">
      {event.category || "Annat"}
    </div>
  )}
</div>

<div className="profile-article-content">
  <span className="profile-article-category">
    {event.category || "Annat"}
  </span>

  <h3>
    {event.title}
  </h3>

  {event.description && (
    <p>
      {event.description}
    </p>
  )}

  <div className="profile-article-meta">
    <span>
      {event.createdAt
        ? new Date(
            event.createdAt
          ).toLocaleDateString(
            "sv-SE",
            {
              day: "numeric",
              month: "short"
            }
          )
        : ""}
    </span>

    <span>
      ✓ {Number(event.confirmationCount) || 0}
    </span>

    <span>
      ○ {Number(event.observationCount) || 0}
    </span>
  </div>
</div>
        </button>
      ))}
    </div>
  )
) : (
  followedEvents.length === 0 ? (
    <div className="profile-empty">
      Du följer inga artiklar ännu.
    </div>
  ) : (
    <div className="profile-article-list">
      {followedEvents.slice(0, 5).map((event) => (
        <button
          type="button"
          className="profile-article"
          key={event.id}
          onClick={() => onEventClick(event)}
        >
          <div className="profile-article-image">
  {event.imageUrl ? (
    <img
      src={event.imageUrl}
      alt=""
    />
  ) : (
    <div className="profile-article-placeholder">
      {event.category || "Annat"}
    </div>
  )}
</div>

<div className="profile-article-content">
  <span className="profile-article-category">
    {event.category || "Annat"}
  </span>

  <h3>
    {event.title}
  </h3>

  {event.description && (
    <p>
      {event.description}
    </p>
  )}

  <div className="profile-article-meta">
    <span>
      {event.createdAt
        ? new Date(
            event.createdAt
          ).toLocaleDateString(
            "sv-SE",
            {
              day: "numeric",
              month: "short"
            }
          )
        : ""}
    </span>

    <span>
      ✓ {Number(event.confirmationCount) || 0}
    </span>

    <span>
      ○ {Number(event.observationCount) || 0}
    </span>
  </div>
</div>
        </button>
      ))}
    </div>
  )
)}

        </section>

        


        


      </div>

    </main>
  );

}


export default Profile;