import { useEffect, useState } from "react";
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../app/firebase";
import "../style/AuthGate.css";

export default function AuthGate({ children }) {
  const [user, setUser] = useState(undefined); // undefined = still checking, null = signed out
  const [error, setError] = useState(null);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  async function handleSignIn() {
    setError(null);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (e) {
      if (e.code !== "auth/popup-closed-by-user") {
        console.error("Sign-in failed:", e);
        setError("Sign-in failed. Please try again.");
      }
    }
  }

  if (user === undefined) return <div className="auth-screen">Loading…</div>;

  if (!user) {
    return (
      <div className="auth-screen">
        <h1>ScrapMap</h1>
        <button onClick={handleSignIn} className="auth-button">Sign in with Google</button>
        {error && <p className="auth-error">{error}</p>}
      </div>
    );
  }

  return children(user);
}