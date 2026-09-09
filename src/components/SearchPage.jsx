import { useEffect, useState } from "react";
import { ArrowLeft, Search, X } from "lucide-react";
import EventCard from "./EventCard";
import { API_URL } from "../config";

function SearchPage({
  onBack,
  onEventClick,
  onConfirmationChange,
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setResults([]);
      setLoading(false);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `${API_URL}/api/search?q=${encodeURIComponent(
            trimmedQuery
          )}`
        );

        console.log("SÖK-URL:", `${API_URL}/api/search?q=${encodeURIComponent(trimmedQuery)}`);
        console.log("SÖK-STATUS:", response.status);

        if (!response.ok) {
          throw new Error(
            "Kunde inte söka efter händelser."
          );
        }

        const data = await response.json();

        console.log("SÖK-RESULTAT:", data);

        setResults(data);
      } catch (error) {
        console.error(
          "Fel vid sökning:",
          error
        );

        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  function handleClear() {
    setQuery("");
  }

  return (
    <main className="search-page">

      <div className="search-header">

        <button
          type="button"
          className="search-back-button"
          onClick={onBack}
          aria-label="Tillbaka"
        >
          <ArrowLeft size={24} />
        </button>

        <div className="search-input-wrapper">

          <Search
            size={21}
            strokeWidth={2}
          />

          <input
            type="search"
            value={query}
            onChange={(event) => {
  console.log("SKRIVER:", event.target.value);
  setQuery(event.target.value);
}}
            placeholder="Sök"
            autoFocus
          />

          {query && (
            <button
              type="button"
              className="search-clear-button"
              onClick={handleClear}
              aria-label="Rensa sökning"
            >
              <X size={19} />
            </button>
          )}

        </div>

      </div>

      <div className="search-results">

        {!query.trim() && (
          <div className="search-empty">
            <Search
              size={38}
              strokeWidth={1.5}
            />

            <h2>
              Sök efter händelser
            </h2>

            <p>
              Sök på till exempel plats,
              kategori eller något som
              står i en händelse.
            </p>
          </div>
        )}

        {loading && (
          <div className="search-status">
            Söker...
          </div>
        )}

        {!loading &&
          query.trim() &&
          results.length === 0 && (
            <div className="search-empty">
              <h2>
                Inga händelser hittades
              </h2>

              <p>
                Prova att söka på något annat.
              </p>
            </div>
          )}

        {!loading &&
          results.length > 0 && (
            <div className="search-event-list">

              {results.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  onClick={() =>
                    onEventClick(event)
                  }
                  onConfirmationChange={
                    onConfirmationChange
                  }
                />
              ))}

            </div>
          )}

      </div>

    </main>
  );
}

export default SearchPage;