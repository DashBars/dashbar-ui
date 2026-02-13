import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Bar } from '@/lib/api/types';
import { Skeleton } from '@/components/ui/skeleton';

interface BarsSummaryCardsProps {
  bars: Bar[] | undefined;
  isLoading: boolean;
}

export function BarsSummaryCards({
  bars,
  isLoading,
}: BarsSummaryCardsProps) {
  if (isLoading) {
    return <Skeleton className="h-10 w-full rounded-2xl" />;
  }

  const totalBars = bars?.length || 0;
  const openBars = bars?.filter((b) => b.status === 'open').length || 0;
  const closedBars = bars?.filter((b) => b.status === 'closed').length || 0;
  const lowStockBars = bars?.filter((b) => b.status === 'lowStock').length || 0;

  return (
    <Card className="rounded-2xl">
      <CardContent className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Total</span>
            <Badge variant="secondary" className="text-sm font-semibold px-2.5">
              {totalBars}
            </Badge>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-sm text-muted-foreground">Abiertas</span>
            <span className="text-sm font-semibold">{openBars}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-gray-400" />
            <span className="text-sm text-muted-foreground">Cerradas</span>
            <span className="text-sm font-semibold">{closedBars}</span>
          </div>
          {lowStockBars > 0 && (
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-sm text-muted-foreground">Stock bajo</span>
              <Badge variant="outline" className="text-xs border-amber-300 bg-amber-50 text-amber-700 px-1.5">
                {lowStockBars}
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
