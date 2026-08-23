import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap
} from "react-leaflet";

import { useEffect, useState } from "react";

import "leaflet/dist/leaflet.css";


// =========================
// STANDARDPOSITION
// VISBY
// =========================

const DEFAULT_POSITION = [
  57.6348,
  18.2948
];


// =========================
// FLYTTA KARTAN
// TILL ANVÄNDARENS PLATS
// =========================

function MapLocationController({
  userLocation
}) {
  const map = useMap();

  useEffect(() => {

    if (!userLocation) {
      return;
    }

    map.setView(
      userLocation,
      14
    );

  }, [
    userLocation,
    map
  ]);

  return null;
}


// =========================
// MAP PAGE
// =========================

function MapPage({
  events,
  onEventClick
}) {

  const [userLocation, setUserLocation] =
    useState(null);

  const [locationError, setLocationError] =
    useState("");


  // =========================
  // HÄMTA ANVÄNDARENS PLATS
  // =========================

  useEffect(() => {

    if (!navigator.geolocation) {

      setLocationError(
        "Din webbläsare stödjer inte platsdelning."
      );

      return;
    }


    navigator.geolocation.getCurrentPosition(

      (position) => {

        const location = [
          position.coords.latitude,
          position.coords.longitude
        ];

        setUserLocation(location);

      },

      (error) => {

        console.error(
          "Kunde inte hämta användarens plats:",
          error
        );

        setLocationError(
          "Kunde inte hämta din plats."
        );

      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }

    );

  }, []);


  // =========================
  // KARTANS STARTPOSITION
  // =========================

  const mapPosition =
    userLocation ||
    DEFAULT_POSITION;


  return (
    <main className="map-page">

      <div className="map-header">

        <h1>
          Karta
        </h1>

        <p>
          Händelser nära dig
        </p>

      </div>


      {/* =========================
          PLATSFEL
      ========================= */}

      {locationError && (

        <div className="map-location-error">
          {locationError}
        </div>

      )}


      <div className="map-container">

        <MapContainer
          center={mapPosition}
          zoom={13}
          scrollWheelZoom={true}
          className="map"
        >

          {/* =========================
              KARTLAGER
          ========================= */}

          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />


          {/* =========================
              FLYTTA KARTAN
          ========================= */}

          <MapLocationController
            userLocation={userLocation}
          />


          {/* =========================
              ANVÄNDARENS POSITION
          ========================= */}

          {userLocation && (

            <Marker
              position={userLocation}
            >

              <Popup>
                Du är här
              </Popup>

            </Marker>

          )}


          {/* =========================
              HÄNDELSER
          ========================= */}

          {events.map((event) => {

            if (
              event.latitude == null ||
              event.longitude == null
            ) {
              return null;
            }


            const latitude =
              Number(event.latitude);

            const longitude =
              Number(event.longitude);


            if (
              Number.isNaN(latitude) ||
              Number.isNaN(longitude)
            ) {
              return null;
            }


            return (

              <Marker
                key={event.id}
                position={[
                  latitude,
                  longitude
                ]}
              >

                <Popup>

                  <div className="map-popup">

                    <strong>
                      {event.title}
                    </strong>


                    <span>
                      {event.category}
                    </span>


                    {event.location && (
                      <span>
                        📍 {event.location}
                      </span>
                    )}


                    <button
                      type="button"
                      onClick={() =>
                        onEventClick(event)
                      }
                    >
                      Visa händelse
                    </button>

                  </div>

                </Popup>

              </Marker>

            );

          })}

        </MapContainer>

      </div>

    </main>
  );
}

export default MapPage;