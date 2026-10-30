import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Trip } from '../types/trip';
import { loadTrips, removeTrip, writeTrip } from '../lib/database';
import { validateTrip } from '../lib/trip-utils';

type Value = {
  trips: Trip[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  saveTrip: (trip: Trip) => Promise<void>;
  deleteTrip: (id: string) => Promise<void>;
};
const TripContext = createContext<Value | null>(null);

export function TripProvider({ children }: { children: ReactNode }) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function reload() {
    return loadTrips()
      .then((loaded) => {
        setTrips(loaded);
        setError(null);
      })
      .catch(() => setError('Deine Reisen konnten nicht geladen werden. Bitte versuche es erneut.'))
      .finally(() => setLoading(false));
  }
  useEffect(() => { void reload(); }, []);

  async function saveTrip(trip: Trip) {
    // Auch Aufrufer ausserhalb des Formulars muessen gueltige Daten liefern.
    const error = validateTrip(trip);
    if (error) throw new Error(error);
    const saved: Trip = JSON.parse(JSON.stringify(trip));
    await writeTrip(saved);
    // Die sichtbare Liste erst nach erfolgreicher Speicherung aendern.
    setTrips((current) => [...current.filter((item) => item.id !== saved.id), saved]);
  }
  async function deleteTrip(id: string) {
    await removeTrip(id);
    setTrips((current) => current.filter((item) => item.id !== id));
  }
  return <TripContext.Provider value={{ trips, loading, error, reload, saveTrip, deleteTrip }}>{children}</TripContext.Provider>;
}
export function useTrips() {
  const value = useContext(TripContext);
  if (!value) throw new Error('useTrips muss innerhalb von TripProvider verwendet werden.');
  return value;
}
