import React, { useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function AddPinOnClick({ onAddPin }) {
  useMapEvents({
    click(e) {
      onAddPin({ id: crypto.randomUUID(), lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null; // renders nothing — it's a listener, not UI
}

const Map = () => {
  const mapRef = useRef(null);
  const latitude = 0;
  const longitude = 0;
  const [pins, setPins] = useState([]);

  
  return ( 
    // Make sure you set the height and width of the map container otherwise the map won't show
      <MapContainer center={[latitude, longitude]} zoom={2} minZoom={0} maxZoom={19} ref={mapRef} style={{height: "100vh", width: "100vw"}}>
        {/* Detail layer: zoom 17+ */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            minZoom={17}
        />
        {/* Watercolor + labels: zoom 0–16 */}
        <TileLayer
          attribution='&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://stamen.com/" target="_blank">Stamen Design</a>'
          url="https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg"
          maxZoom={16}
        />
        <TileLayer
          attribution='&copy; <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
          url="https://tiles.stadiamaps.com/tiles/stamen_toner_labels/{z}/{x}/{y}{r}.png"
          maxZoom={16}
        />
        {pins.map((pin) => (
          <Marker key={pin.id} position={[pin.lat, pin.lng]} />
        ))}

        <AddPinOnClick onAddPin={(pin) => setPins((prev) => [...prev, pin])} />
        
      </MapContainer>
      
  );
};

export default Map;