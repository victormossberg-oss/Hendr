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

const userLocationIcon = L.divIcon({
  className: "hendr-user-marker",
  html: '<div class="hendr-user-marker-dot"></div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14]
});

const eventIcons = {
  Brand: L.divIcon({
    className: "hendr-event-marker marker-brand",
    html: '<div class="hendr-event-marker-dot"></div>',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28]
  }),

  Trafik: L.divIcon({
    className: "hendr-event-marker marker-trafik",
    html: '<div class="hendr-event-marker-dot"></div>',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28]
  }),

  Olycka: L.divIcon({
    className: "hendr-event-marker marker-olycka",
    html: '<div class="hendr-event-marker-dot"></div>',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28]
  }),

  Brott: L.divIcon({
    className: "hendr-event-marker marker-brott",
    html: '<div class="hendr-event-marker-dot"></div>',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28]
  }),

  Evenemang: L.divIcon({
    className: "hendr-event-marker marker-evenemang",
    html: '<div class="hendr-event-marker-dot"></div>',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28]
  }),

  Annat: L.divIcon({
    className: "hendr-event-marker marker-annat",
    html: '<div class="hendr-event-marker-dot"></div>',
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28]
  })
};


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
  userLocation,
  selectedEvent
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedEvent) {
      const latitude = Number(selectedEvent.latitude);
      const longitude = Number(selectedEvent.longitude);

      if (
        !Number.isNaN(latitude) &&
        !Number.isNaN(longitude)
      ) {
        map.setView(
          [latitude, longitude],
          16
        );

        return;
      }
    }

    if (userLocation) {
      map.setView(
        userLocation,
        14
      );
    }
  }, [
    userLocation,
    selectedEvent,
    map
  ]);

  return null;
}


// =========================
// MAP PAGE
// =========================

function MapPage({
  events,
  onEventClick,
  selectedEvent
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
    latitude: position.coords.latitude,
    longitude: position.coords.longitude,
    accuracy: position.coords.accuracy,
    timestamp: new Date(position.timestamp)
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
  selectedEvent={selectedEvent}
/>


          {/* =========================
              ANVÄNDARENS POSITION
          ========================= */}

          {userLocation && (

            <Marker
              position={userLocation}
              icon={userLocationIcon}
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

                icon={
                  eventIcons[event.category] ||
                  eventIcons.Annat
                }
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
                      className="map-popup-button"
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