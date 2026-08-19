import { MapPin } from "lucide-react";

function LocationDisplay({ latitude, longitude }) {
  if (!latitude || !longitude) {
    return (
      <div className="location-display">
        <MapPin />
        <span>Plats saknas</span>
      </div>
    );
  }

  return (
    <div className="location-display">
      <MapPin />

      <div>
        <strong>Visby</strong>

        <span>
          {latitude.toFixed(5)}, {longitude.toFixed(5)}
        </span>
      </div>
    </div>
  );
}

export default LocationDisplay;