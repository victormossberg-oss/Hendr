import { useEffect, useRef, useState } from "react";
import { Search as SearchIcon, X } from "lucide-react";

function Search({ onBack, onEventClick }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSubmit(event) {
    event.preventDefault();
  }

  return (
    <div className="search-page">
      <form
        className="search-topbar"
        onSubmit={handleSubmit}
      >
        <div className="search-input-wrapper">
          <SearchIcon
            size={23}
            strokeWidth={2}
            className="search-input-icon"
          />

          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            placeholder="Sök"
            aria-label="Sök efter händelser"
            autoComplete="off"
          />

          {query && (
            <button
              type="button"
              className="search-clear"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              aria-label="Rensa sökning"
            >
              <X size={18} strokeWidth={2.2} />
            </button>
          )}
        </div>

        <button
          type="button"
          className="search-cancel"
          onClick={onBack}
        >
          Avbryt
        </button>
      </form>

      <div className="search-content">
        {!query.trim() ? (
          <div className="search-empty">
            <SearchIcon
              size={34}
              strokeWidth={1.5}
            />

            <h2>Sök efter händelser</h2>

            <p>
              Sök på en händelse, plats eller kategori.
            </p>
          </div>
        ) : (
          <div className="search-results">
            <p className="search-results-label">
              Sökresultat
            </p>

            <div className="search-placeholder">
              <p>
                Söker efter{" "}
                <strong>“{query}”</strong>
              </p>

              <span>
                Resultaten kopplas in i nästa steg.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Search;