import { useState } from "react";
import { API_URL } from "../config";

function Login({
  onLogin,
  onBack
}) {

  const [registerMode, setRegisterMode] =
    useState(false);

  const [username, setUsername] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

    const handleResendVerification = async () => {
  try {
    const response = await fetch(
      `${API_URL}/api/auth/resend-verification`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Kunde inte skicka verifieringsmejlet."
      );
    }

    alert(data.message);

  } catch (error) {
    console.error(
      "Fel vid nytt verifieringsmejl:",
      error
    );

    alert(error.message);
  }
};


  // =========================
  // LOGGA IN
  // =========================

  async function handleLogin(e) {

    e.preventDefault();

    setError("");
    setLoading(true);


    try {

      const response =
        await fetch(
          `${API_URL}/api/auth/login`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              email,
              password
            })
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.message ||
          "Kunde inte logga in."
        );

      }


      // =========================
      // LOGIN LYCKADES
      // =========================

      localStorage.setItem(
        "hendr_token",
        data.token
      );


      localStorage.setItem(
        "hendr_user",
        JSON.stringify(
          data.user
        )
      );


      onLogin(
        data.user
      );


    } catch (error) {

      console.error(
        "Login-fel:",
        error
      );


      setError(
        error.message
      );


    } finally {

      setLoading(false);

    }

  }


  // =========================
  // SKAPA KONTO
  // =========================

  async function handleRegister(e) {

    e.preventDefault();

    setError("");


    // =========================
    // KONTROLLERA LÖSENORD
    // =========================

    if (
      password !==
      confirmPassword
    ) {

      setError(
        "Lösenorden matchar inte."
      );

      return;

    }


    if (
      password.length < 8
    ) {

      setError(
        "Lösenordet måste vara minst 8 tecken."
      );

      return;

    }


    setLoading(true);


    try {

      const response =
        await fetch(
          `${API_URL}/api/auth/register`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({
              username,
              email,
              password
            })
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.message ||
          "Kunde inte skapa kontot."
        );

      }


// =========================
// REGISTRERING LYCKADES
// =========================

setError(
  data.message ||
  "Kontot skapades. Kontrollera din e-post för att verifiera kontot."
);

setPassword("");
setConfirmPassword("");


    } catch (error) {

      console.error(
        "Registreringsfel:",
        error
      );


      setError(
        error.message
      );


    } finally {

      setLoading(false);

    }

  }


  // =========================
  // BYT MELLAN LOGIN
  // OCH REGISTRERING
  // =========================

  function switchMode() {

    setRegisterMode(
      !registerMode
    );

    setError("");

    setUsername("");

    setEmail("");

    setPassword("");

    setConfirmPassword("");

  }


  return (

    <main className="observation-page">

      <div className="observation-content">


        {/* =========================
            LOGGA / HENDR
        ========================= */}

        <span className="event-category">

          HENDR

        </span>


        <h1>

          {registerMode
            ? "Skapa konto"
            : "Logga in"}

        </h1>


        <p className="observation-intro">

          {registerMode

            ? "Skapa ett konto för att kunna skapa och hantera dina händelser."

            : "Logga in för att skapa och hantera dina händelser."}

        </p>


        {/* =========================
            FORMULÄR
        ========================= */}

        <form
          onSubmit={
            registerMode
              ? handleRegister
              : handleLogin
          }
        >


          {/* =========================
              ANVÄNDARNAMN
              ENDAST REGISTRERING
          ========================= */}

          {registerMode && (

            <>

              <label htmlFor="username">

                Användarnamn

              </label>


              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) =>
                  setUsername(
                    e.target.value
                  )
                }
                placeholder="Ditt användarnamn"
                minLength={3}
                maxLength={25}
                required
                disabled={loading}
              />

            </>

          )}


          {/* =========================
              E-POST
          ========================= */}

          <label htmlFor="email">

            E-post

          </label>


          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) =>
              setEmail(
                e.target.value
              )
            }
            placeholder="din@email.se"
            required
            disabled={loading}
          />


          {/* =========================
              LÖSENORD
          ========================= */}

          <label htmlFor="password">

            Lösenord

          </label>


          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }
            placeholder="Ditt lösenord"
            minLength={8}
            required
            disabled={loading}
          />


          {/* =========================
              BEKRÄFTA LÖSENORD
              ENDAST REGISTRERING
          ========================= */}

          {registerMode && (

            <>

              <label htmlFor="confirmPassword">

                Bekräfta lösenord

              </label>


              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(
                    e.target.value
                  )
                }
                placeholder="Skriv lösenordet igen"
                minLength={8}
                required
                disabled={loading}
              />

            </>

          )}


          {/* =========================
              FEL
          ========================= */}

          {error && (

            <p className="location-error">

              {error}

            </p>

          )}


          {/* =========================
              HUVUDKNAPP
          ========================= */}

          <button
            type="submit"
            className="submit-observation"
            disabled={loading}
          >

            {loading

              ? (
                  registerMode
                    ? "Skapar konto..."
                    : "Loggar in..."
                )

              : (
                  registerMode
                    ? "Skapa konto"
                    : "Logga in"
                )}

          </button>


          {/* =========================
              BYT MELLAN LOGIN
              OCH REGISTRERING
          ========================= */}

          <button
            type="button"
            className="back-button"
            onClick={switchMode}
            disabled={loading}
          >

            {registerMode

              ? "Har du redan ett konto? Logga in"

              : "Skapa konto"}

          </button>


          {/* =========================
              TILLBAKA
          ========================= */}

          {!registerMode &&
            onBack && (

              <button
                type="button"
                className="back-button"
                onClick={onBack}
                disabled={loading}
              >

                Tillbaka

              </button>

            )}


        </form>

      </div>

    </main>

  );

}


export default Login;