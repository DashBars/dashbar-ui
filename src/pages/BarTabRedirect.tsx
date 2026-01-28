import { Navigate, useParams } from 'react-router-dom';

type TabKey = 'overview' | 'stock' | 'recipes' | 'pos';

export function BarTabRedirect({ tab }: { tab: TabKey }) {
  const { eventId, barId } = useParams<{ eventId: string; barId: string }>();

  if (!eventId || !barId) {
    return <Navigate to="/events" replace />;
  }

  return (
    <Navigate
      to={`/events/${eventId}/bars/${barId}?tab=${tab}`}
      replace
    />
  );
}

