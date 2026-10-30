import type { Stop } from '../types/trip';
export type TripMapProps = {
  stops: Stop[];
  selectedId?: string;
  height?: number;
  editable?: boolean;
  drawRoute?: boolean;
  onSelect?: (id: string) => void;
  onPick?: (latitude: number, longitude: number) => void;
};
