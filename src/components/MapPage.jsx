import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap
} from "react-leaflet";

import { useEffect, useState } from "react";

import L from "leaflet";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import "leaflet/dist/leaflet.css";


// =========================
// LEAFLET MARKÖR-IKON
// =========================

const defaultIcon = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,

  iconSize: [25, 41],

  iconAnchor: [12, 41],

  popupAnchor: [1, -34],

  shadowSize: [41, 41]
});


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

        console.log(
          "GPS-position:",
          {
            latitude:
              position.coords.latitude,

            longitude:
              position.coords.longitude
          }
        );

        setUserLocation(location);

        setLocationError("");

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


      {/* =========================
          HEADER
      ========================= */}

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


      {/* =========================
          KARTA
      ========================= */}

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
            attribution="&copy; OpenStreetMap contributors"
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
              icon={defaultIcon}
            >

              <Popup>

                <strong>
                  Du är här
                </strong>

              </Popup>

            </Marker>

          )}


          {/* =========================
              HÄNDELSER
          ========================= */}

          {events.map((event) => {


            // -------------------------
            // SAKNAR KOORDINATER
            // -------------------------

            if (
              event.latitude == null ||
              event.longitude == null
            ) {

              return null;

            }


            // -------------------------
            // KONVERTERA TILL NUMBER
            // -------------------------

            const latitude =
              Number(event.latitude);

            const longitude =
              Number(event.longitude);


            // -------------------------
            // OGILTIGA KOORDINATER
            // -------------------------

            if (
              Number.isNaN(latitude) ||
              Number.isNaN(longitude)
            ) {

              return null;

            }


            console.log(
              "Event på karta:",
              event.title,
              latitude,
              longitude
            );


            // -------------------------
            // MARKÖR
            // -------------------------

            return (

              <Marker
                key={event.id}

                position={[
                  latitude,
                  longitude
                ]}

                icon={defaultIcon}
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