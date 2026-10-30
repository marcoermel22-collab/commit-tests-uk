import { useLocalSearchParams } from 'expo-router';
import { Screen, EmptyState } from '../../components/UI';
import TripForm from '../../components/TripForm';
import { useTrips } from '../../state/TripContext';
export default function EditScreen() {
  const { id, stopId, entryId } = useLocalSearchParams<{
    id: string;
    stopId?: string;
    entryId?: string;
  }>();
  const { trips } = useTrips();
  const trip = trips.find((item) => item.id === id);
  return trip ? (
    <TripForm original={trip} initialStopId={stopId} initialEntryId={entryId} />
  ) : (
    <Screen>
      <EmptyState
        title="Reise nicht gefunden"
        text="Diese Reise wurde möglicherweise gelöscht."
      />
    </Screen>
  );
}
