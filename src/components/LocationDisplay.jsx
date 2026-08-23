import { MapPin } from "lucide-react";

function LocationDisplay({
  latitude,
  longitude,
  location
}) {
  if (
    latitude == null ||
    longitude == null
  ) {
    return (
      <div className="location-display">
        <MapPin />

        <span>
          Plats saknas
        </span>
      </div>
    );
  }

  return (
    <div className="location-display">

      <MapPin />

      <div>

        <strong>
          {location || "Okänd plats"}
        </strong>

        <span>
          {Number(latitude).toFixed(5)},{" "}
          {Number(longitude).toFixed(5)}
        </span>

      </div>

    </div>
  );
}

export default LocationDisplay;