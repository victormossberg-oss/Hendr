import { useState } from "react";
import { MapPin, LoaderCircle } from "lucide-react";

function LocationPicker({ onLocationChange }) {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function getLocation() {
    if (!navigator.geolocation) {
      setError("Din webbläsare stödjer inte platsdelning.");
      return;
    }

    setLoading(true);
    setError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };

        setLocation(newLocation);
        setLoading(false);

        onLocationChange(newLocation);
      },
      () => {
        setError(
          "Kunde inte hämta din plats. Kontrollera att platsdelning är aktiverad."
        );

        setLoading(false);
      }
    );
  }

  return (
    <div className="location-picker">

      {location ? (
        <div className="location-selected">
          <MapPin />

          <div>
            <strong>Plats hämtad</strong>

            <span>
              {location.latitude.toFixed(5)},{" "}
              {location.longitude.toFixed(5)}
            </span>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="location-button"
          onClick={getLocation}
          disabled={loading}
        >
          {loading ? (
            <>
              <LoaderCircle className="spinner" />
              Hämtar plats...
            </>
          ) : (
            <>
              <MapPin />
              Använd min plats
            </>
          )}
        </button>
      )}

      {error && (
        <p className="location-error">
          {error}
        </p>
      )}

    </div>
  );
}

export default LocationPicker;