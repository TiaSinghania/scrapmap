import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../app/firebase";
import Sidebar from "./Sidebar";
import PreviewForm from "./PreviewForm";
import Preview from "./Preview";
import "leaflet/dist/leaflet.css";
import "../style/Map.css"; 

// 1. MAP CLICK CATCHER
function ClickCatcher({ onMapClick }) {
  useMapEvents({
    click: (e) => onMapClick(e.latlng),
  });
  return null;
}

// 2. CUSTOM PIN COMPONENT
function Pin({ id, lat, lon, onClick }) {
  return (
    <Marker 
      position={[lat, lon]} 
      eventHandlers={{ click: () => onClick(id) }} 
    />
  );
}

export default function Map() {
  const [pins, setPins] = useState([]);
  
  const [activePinId, setActivePinId] = useState(null); 
  const [isEditing, setIsEditing] = useState(false);    
  const [pendingLocation, setPendingLocation] = useState(null); 

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'pins'), (snapshot) => {
      const fetchedPins = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPins(fetchedPins);
    });
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

  function closeSidebar() {
    setActivePinId(null);
    setPendingLocation(null);
    setIsEditing(false);
  }

  const activePinData = activePinId 
    ? pins.find(p => p.id === activePinId) 
    : pendingLocation; 

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
          <Pin key={pin.id} id={pin.id} lat={pin.lat} lon={pin.lon} onClick={handlePinClick} />
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
            />
          )}
        </Sidebar>
      )}
    </div>
  );
}