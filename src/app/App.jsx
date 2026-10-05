import AuthGate from "../components/AuthGate";
import Map from "../components/Map";

export default function App() {
  return <AuthGate>{(user) => <Map user={user} />}</AuthGate>;
}