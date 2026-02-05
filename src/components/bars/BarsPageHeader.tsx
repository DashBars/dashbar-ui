import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface BarsPageHeaderProps {
  eventId: number;
  eventName?: string;
  onCreateBar: () => void;
  isEventFinished?: boolean;
}

export function BarsPageHeader({
  eventId,
  eventName = 'Event',
  onCreateBar,
  isEventFinished = false,
}: BarsPageHeaderProps) {
  return (
    <div className="sticky top-0 z-10 bg-background border-b pb-4 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <nav className="text-sm text-muted-foreground mb-2" aria-label="Breadcrumb">
            <Link
              to="/events"
              className="hover:text-foreground transition-colors"
            >
              Events
            </Link>
            <span className="mx-2">/</span>
            <Link
              to={`/events/${eventId}`}
              className="hover:text-foreground transition-colors"
            >
              {eventName}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-foreground font-medium">Bars</span>
          </nav>
          <h1 className="text-3xl font-bold tracking-tight">Bars</h1>
        </div>
        {!isEventFinished && (
          <Button 
            onClick={onCreateBar} 
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Create bar
          </Button>
        )}
      </div>
    </div>
  );
}
