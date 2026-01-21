import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const totalBars = bars?.length || 0;
  const openBars = bars?.filter((b) => b.status === 'open').length || 0;
  const closedBars = bars?.filter((b) => b.status === 'closed').length || 0;
  const lowStockBars = bars?.filter((b) => b.status === 'lowStock').length || 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Bars</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalBars}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Open</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{openBars}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Closed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{closedBars}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{lowStockBars}</div>
        </CardContent>
      </Card>
    </div>
  );
}
