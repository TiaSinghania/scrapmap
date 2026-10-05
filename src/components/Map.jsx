import { collection, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import { db, storage, auth } from "../app/firebase";
import { signOut } from "firebase/auth";
import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Tooltip, useMapEvents } from "react-leaflet";
import Sidebar from "./Sidebar";
import PreviewForm from "./PreviewForm";
import Preview from "./Preview";
import "leaflet/dist/leaflet.css";
import "../style/Map.css"; 
import "../style/AuthGate.css";
import L from "leaflet";


const pinIcon = L.divIcon({
  className: "", // removes Leaflet's default white-box divIcon styling
  html: `
    <svg width="28" height="40" viewBox="0 0 28 40" xmlns="http://www.w3.org/2000/svg"
         style="filter: drop-shadow(0 2px 2px rgba(0,0,0,0.35));">
      <line x1="14" y1="22" x2="14" y2="39" stroke="#6b7280" stroke-width="2" stroke-linecap="round"/>
      <circle cx="14" cy="12" r="10" fill="#e11d48" stroke="#9f1239" stroke-width="1.5"/>
      <circle cx="10.5" cy="8.5" r="3" fill="#fff" opacity="0.45"/>
    </svg>`,
  iconSize: [28, 40],
  iconAnchor: [14, 39], // needle tip sits on the exact location
  popupAnchor: [0, -40],
  tooltipAnchor: [0, -40],
});


// 1. MAP CLICK CATCHER
function ClickCatcher({ onMapClick }) {
  useMapEvents({
    click: (e) => onMapClick(e.latlng),
  });
  return null;
}


function Pin({ id, lat, lon, title, onClick }) {
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
}

export default function Map( {user} ) {
  const [pins, setPins] = useState([]);
  
  const [activePinId, setActivePinId] = useState(null); 
  const [isEditing, setIsEditing] = useState(false);    
  const [pendingLocation, setPendingLocation] = useState(null); 
  const [accessDenied, setAccessDenied] = useState(false);

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
    setPendingLocation({ lat: latlng.lat, lon: latlng.lng });
    setIsEditing(true);
  }

  function handlePinClick(id) {
    setPendingLocation(null);
    setIsEditing(false);
    setActivePinId(id);
  }

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

  function closeSidebar() {
    setActivePinId(null);
    setPendingLocation(null);
    setIsEditing(false);
  }

  const activePinData = activePinId 
    ? pins.find(p => p.id === activePinId) 
    : pendingLocation; 

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
        minZoom={0} 
        maxZoom={19} 
        className="map-container"
      >
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

        {pins.map((pin) => (
          <Pin key={pin.id} id={pin.id} lat={pin.lat} lon={pin.lon} title={pin.title} onClick={handlePinClick} />
        ))}

        {pendingLocation && !activePinId && (
          <Marker position={[pendingLocation.lat, pendingLocation.lon]} />
        )}
      </MapContainer>

      {(activePinId || pendingLocation) && (
        <Sidebar onClose={closeSidebar}>
          {isEditing ? (
            <PreviewForm 
              pin={activePinData} 
              onComplete={closeSidebar} 
              onCancel={closeSidebar} 
            />
          ) : (
            <Preview 
              pin={activePinData} 
              onEdit={() => setIsEditing(true)} 
              onDelete={handleDelete}
            />
          )}
        </Sidebar>
      )}
    </div>
  );
}