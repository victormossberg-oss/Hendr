import { useState } from "react";
import { API_URL } from "../config";

function Login({ onLogin, onBack }) {

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  async function handleSubmit(e) {

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


      // Skicka användaren
      // vidare till App.jsx

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


  return (
    <main className="observation-page">

      <div className="observation-content">

        <span className="event-category">
          HENDR
        </span>


        <h1>
          Logga in
        </h1>


        <p className="observation-intro">
          Logga in för att skapa och
          hantera dina händelser.
        </p>


        <form
          onSubmit={handleSubmit}
        >

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
            required
            disabled={loading}
          />


          {/* =========================
              FEL
          ========================= */}

          {error && (

            <p className="location-error">
              {error}
            </p>

          )}


          {/* =========================
              LOGIN
          ========================= */}

          <button
            type="submit"
            className="submit-observation"
            disabled={loading}
          >

            {loading
              ? "Loggar in..."
              : "Logga in"}

          </button>


          {/* =========================
              TILLBAKA
          ========================= */}

          {onBack && (

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