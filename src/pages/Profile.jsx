function Profile({
  user
}) {

  return (

    <main className="profile-page">

      <div className="profile-content">

        <span className="event-category">
          Profil
        </span>

        <h1>
          {user.username}
        </h1>

        <p>
          {user.email}
        </p>

      </div>

    </main>

  );

}

export default Profile;