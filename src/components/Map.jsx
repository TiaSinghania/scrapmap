import { collection, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage, auth } from "../app/firebase";
import { signOut } from "firebase/auth";
import { useState, useEffect, useCallback, memo } from "react";
import { MapContainer, TileLayer, Marker, Tooltip, ZoomControl, useMapEvents } from "react-leaflet";
import Sidebar from "./Sidebar";
import PreviewForm from "./PreviewForm";
import Preview from "./Preview";
import "leaflet/dist/leaflet.css";
import "../style/Map.css";
import "../style/AuthGate.css";
import L from "leaflet";


// ---------- PIN ICONS ----------
// Colors live in Map.css (.pin-head, .pin-needle...) so they follow your palette variables.
function makePinIcon(modifier = "") {
  return L.divIcon({
    className: "pin-icon", // replaces Leaflet's default white-box divIcon styling
    html: `
      <svg class="pin-svg ${modifier}" width="30" height="42" viewBox="0 0 30 42" xmlns="http://www.w3.org/2000/svg">
        <line class="pin-needle" x1="15" y1="23" x2="15" y2="41"/>
        <circle class="pin-head" cx="15" cy="13" r="11"/>
        <circle class="pin-shine" cx="11" cy="9" r="3.2"/>
      </svg>`,
    iconSize: [30, 42],
    iconAnchor: [15, 41], // needle tip sits on the exact location
    popupAnchor: [0, -42],
    tooltipAnchor: [0, -42],
  });
}
const pinIcon = makePinIcon();
const pendingPinIcon = makePinIcon("pin-svg--pending"); // the not-yet-saved pin


// ---------- WORLD WRAPPING ----------
// The map repeats left and right forever. Pins are stored with a longitude in
// -180..180, and drawn once per world copy so they're visible wherever you pan.
const WORLD_OFFSETS = [-720, -360, 0, 360, 720];
const wrapLon = (lon) => ((((lon + 180) % 360) + 360) % 360) - 180;


// 1. MAP CLICK CATCHER
function ClickCatcher({ onMapClick }) {
  useMapEvents({
    click: (e) => onMapClick(e.latlng),
  });
  return null;
}


// memo: with 5 world copies per pin, skip re-rendering markers that didn't change
const Pin = memo(function Pin({ id, lat, lon, title, onClick }) {
  return (
    <Marker
      position={[lat, lon]}
      icon={pinIcon}
      eventHandlers={{ click: () => onClick(id) }}
    >
      {title && (
        <Tooltip direction="top">{title}</Tooltip>
      )}
    </Marker>
  );
});

export default function Map( {user} ) {
  const [pins, setPins] = useState([]);

  const [activePinId, setActivePinId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [pendingLocation, setPendingLocation] = useState(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'pins'),
      (snapshot) => {
        setAccessDenied(false);
        setPins(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      },
      (err) => {
        console.error("Pins listener error:", err);
        setAccessDenied(err.code === 'permission-denied');
      }
    );
    return () => unsubscribe();
  }, []);

  function handleMapClick(latlng) {
    setActivePinId(null);
    // latlng.lng can be e.g. 250 when you click a repeated copy of the world; store the wrapped value
    setPendingLocation({ lat: latlng.lat, lon: wrapLon(latlng.lng) });
    setIsEditing(true);
  }

  const handlePinClick = useCallback((id) => {
    setPendingLocation(null);
    setIsEditing(false);
    setActivePinId(id);
  }, []);

  async function handleDelete(pin) {
    // Remove the doc first; onSnapshot then removes the marker automatically
    await deleteDoc(doc(db, "pins", pin.id));

    // Best-effort cleanup of the photos in Storage
    const results = await Promise.allSettled(
      (pin.images || []).map((url) => deleteObject(ref(storage, url)))
    );
    results.forEach((r) => {
      if (r.status === "rejected" && r.reason?.code !== "storage/object-not-found") {
        console.error("Failed to delete image:", r.reason);
      }
    });

    closeSidebar();
  }

  // Trash icon in the sidebar header
  async function handleDeleteClick() {
    if (!activePinData?.id) return;
    if (!window.confirm(`Delete "${activePinData.title}"? This also removes its photos and can't be undone.`)) return;
    setIsDeleting(true);
    try {
      await handleDelete(activePinData);
    } catch (error) {
      console.error("Error deleting pin:", error);
      alert("Failed to delete pin. Check the console.");
    } finally {
      setIsDeleting(false);
    }
  }

  function closeSidebar() {
    setActivePinId(null);
    setPendingLocation(null);
    setIsEditing(false);
  }

  const activePinData = activePinId
    ? pins.find(p => p.id === activePinId)
    : pendingLocation;

  // Edit/delete icons only make sense when looking at a saved pin (not the form)
  const viewingSavedPin = Boolean(activePinId && activePinData && !isEditing);

  if (accessDenied) {
    return (
      <div className="auth-screen">
        <h1>No access</h1>
        <p>{user.email} isn&apos;t on the list for this map.</p>
        <button onClick={() => signOut(auth)} className="auth-button">Sign out</button>
      </div>
    );
  }
  return (
    <div className="map-wrapper">
      <MapContainer
        center={[0, 0]}
        zoom={2}
        minZoom={2}
        maxZoom={19}
        worldCopyJump                              // pan past the edge and the map re-centers on the main world
        maxBounds={[[-85, -3600], [85, 3600]]}     // stops panning past the poles (longitude is effectively unlimited)
        maxBoundsViscosity={1}
        zoomControl={false}                        // moved to the bottom right so the sidebar never covers it
        className="map-container"
      >
        <ZoomControl position="bottomright" />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          minZoom={17}
        />
        <TileLayer
          attribution='&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a>...'
          url="https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg"
          maxZoom={16}
        />
        <TileLayer
          url="https://tiles.stadiamaps.com/tiles/stamen_toner_labels/{z}/{x}/{y}{r}.png"
          maxZoom={16}
        />

        <ClickCatcher onMapClick={handleMapClick} />

        {pins.flatMap((pin) =>
          WORLD_OFFSETS.map((offset) => (
            <Pin
              key={`${pin.id}:${offset}`}
              id={pin.id}
              lat={pin.lat}
              lon={wrapLon(pin.lon) + offset}
              title={pin.title}
              onClick={handlePinClick}
            />
          ))
        )}

        {pendingLocation && !activePinId && WORLD_OFFSETS.map((offset) => (
          <Marker
            key={`pending:${offset}`}
            position={[pendingLocation.lat, pendingLocation.lon + offset]}
            icon={pendingPinIcon}
          />
        ))}
      </MapContainer>

      {(activePinId || pendingLocation) && (
        <Sidebar
          onClose={closeSidebar}
          onEdit={viewingSavedPin ? () => setIsEditing(true) : undefined}
          onDelete={viewingSavedPin ? handleDeleteClick : undefined}
          isDeleting={isDeleting}
        >
          {isEditing ? (
            <PreviewForm
              pin={activePinData}
              onComplete={closeSidebar}
              onCancel={closeSidebar}
            />
          ) : (
            <Preview pin={activePinData} />
          )}
        </Sidebar>
      )}
    </div>
  );
}
