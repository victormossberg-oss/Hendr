function Profile({
  user
}) {

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


  return (

    <main className="profile-page">

      <div className="profile-content">


        {/* =========================
            PROFILHEADER
        ========================= */}

        <section className="profile-header">

          <div className="profile-avatar">
            {initial}
          </div>


          <h1>
            {user.username}
          </h1>


          <p>
            {user.email}
          </p>

        </section>


        {/* =========================
            KONTO
        ========================= */}

        <section className="profile-section">

          <h2>
            Mitt konto
          </h2>


          <div className="profile-info">

            <div className="profile-info-row">

              <span>
                Konto skapades
              </span>

              <strong>
                {createdDate}
              </strong>

            </div>

          </div>

        </section>


      </div>

    </main>

  );

}


export default Profile;