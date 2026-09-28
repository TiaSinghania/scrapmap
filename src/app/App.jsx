import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";
import { db, storage } from "./firebase";
import './App.css'

function App() {
  const [pins, setPins] = useState([]);

  useEffect(() => {
    async function loadPins() {
      const snapshot = await getDocs(collection(db, "pins"));

      const results = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const data = doc.data();
          const imageUrl = await getDownloadURL(ref(storage, data.imagePath));
          return { id: doc.id, ...data, imageUrl };
        })
      );

      setPins(results);
    }

    loadPins().catch(console.error);
  }, []);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
    }}>
      {pins.map((pin) => (
        <div key={pin.id} style={{ textAlign: "center" }}>
          <img src={pin.imageUrl} alt={pin.title} style={{ maxWidth: "400px" }} />
          <h2>{pin.title}</h2>
          <p>{pin.date.toDate().toLocaleDateString()}</p>
          <p>{pin.location.latitude}, {pin.location.longitude}</p>
        </div>
      ))}
    </div>
  );
}

export default App