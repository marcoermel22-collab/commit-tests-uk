// Eine Reise enthält Standorte. Ein Standort enthält Tagebucheinträge.
export type DiaryEntry = {
  id: string;
  title: string;
  date: string; // ISO-Datum: YYYY-MM-DD. Dadurch funktioniert auch das Sortieren.
  text: string;
  photos: string[];
};

export type Stop = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  entries: DiaryEntry[];
};

export type Trip = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  tag: string;
  stops: Stop[];
};

export function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function emptyStop(): Stop {
  return { id: createId(), name: '', latitude: 46.948, longitude: 7.4474, entries: [] };
}

export function emptyTrip(): Trip {
  const date = todayISO();
  return {
    id: createId(),
    title: '',
    startDate: date,
    endDate: date,
    tag: '',
    stops: [emptyStop(), emptyStop()],
  };
}

// Lokales Geraetedatum: UTC koennte nahe Mitternacht den falschen Tag liefern.
export function todayISO(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
