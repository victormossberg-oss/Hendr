import { useEffect, useState } from "react";

const API_URL = "https://hendr.onrender.com";

function VerifyEmail() {
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");

      if (!token) {
        setStatus("error");
        setMessage("Verifieringstoken saknas.");
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/api/auth/verify-email?token=${encodeURIComponent(token)}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Kunde inte verifiera e-postadressen."
          );
        }

        setStatus("success");
        setMessage(data.message);
      } catch (error) {
        console.error("Fel vid e-postverifiering:", error);

        setStatus("error");
        setMessage(error.message);
      }
    };

    verifyEmail();
  }, []);

  return (
    <div>
      {status === "loading" && (
        <p>Verifierar din e-postadress...</p>
      )}

      {status === "success" && (
  <div>
    <h1>E-postadressen är verifierad!</h1>

    <p>{message}</p>

    <button
      type="button"
      className="verify-login-button"
      onClick={() => {
  window.location.href = "/?login=1";
}}
    >
      Logga in
    </button>
  </div>
)}

      {status === "error" && (
        <div>
          <h1>Verifieringen misslyckades</h1>
          <p>{message}</p>
        </div>
      )}
    </div>
  );
}

export default VerifyEmail;