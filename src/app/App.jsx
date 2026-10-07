import AuthGate from "../components/AuthGate";
import Map from "../components/Map";
import TornFilters from "../components/TornFilters";

export default function App() {
  return (
    <>
      <TornFilters />
      <AuthGate>{(user) => <Map user={user} />}</AuthGate>
    </>
  );
}
