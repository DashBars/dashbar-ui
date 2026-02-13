import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Bar } from '@/lib/api/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Wine, Monitor, Package, ChevronRight } from 'lucide-react';

interface BarsTableProps {
  bars: Bar[] | undefined;
  isLoading: boolean;
  onViewDetails: (bar: Bar) => void;
}

const barTypeStyles: Record<string, { badge: 'default' | 'secondary' | 'outline'; icon: string }> = {
  VIP: { badge: 'default', icon: 'bg-primary/10 text-primary' },
  general: { badge: 'secondary', icon: 'bg-blue-500/10 text-blue-600' },
  backstage: { badge: 'outline', icon: 'bg-amber-500/10 text-amber-600' },
  lounge: { badge: 'secondary', icon: 'bg-purple-500/10 text-purple-600' },
};

const statusConfig: Record<string, { label: string; dot: string; badge: 'default' | 'secondary' | 'destructive' }> = {
  open: { label: 'Abierta', dot: 'bg-green-500', badge: 'default' },
  closed: { label: 'Cerrada', dot: 'bg-gray-400', badge: 'secondary' },
  lowStock: { label: 'Stock bajo', dot: 'bg-amber-500', badge: 'destructive' },
};

export function BarsTable(props: BarsTableProps) {
  const { bars, isLoading, onViewDetails } = props;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!bars || bars.length === 0) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Wine className="h-10 w-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">
            No hay barras configuradas para este evento.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {bars.map((bar) => {
        const typeStyle = barTypeStyles[bar.type] || barTypeStyles.general;
        const statusCfg = statusConfig[bar.status] || statusConfig.closed;
        const posCount = bar.posnets?.length || 0;
        const stockCount = bar.stocks?.length || 0;

        return (
          <Card
            key={bar.id}
            className="rounded-xl cursor-pointer hover:bg-muted/30 transition-colors border"
            onClick={() => onViewDetails(bar)}
          >
            <CardContent className="px-4 py-3">
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div className={`rounded-lg p-2.5 shrink-0 ${typeStyle.icon}`}>
                  <Wine className="h-5 w-5" />
                </div>

                {/* Name + type + status */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm truncate">{bar.name}</span>
                    <Badge variant={typeStyle.badge} className="text-[10px] px-1.5 py-0 shrink-0">
                      {bar.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot}`} />
                    <span className="text-xs text-muted-foreground">{statusCfg.label}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-5 shrink-0">
                  <div className="flex items-center gap-1.5 text-sm" title="Terminales POS">
                    <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className={posCount > 0 ? 'font-medium' : 'text-muted-foreground'}>{posCount}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm" title="Insumos en stock">
                    <Package className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className={stockCount > 0 ? 'font-medium' : 'text-muted-foreground'}>{stockCount}</span>
                  </div>
                </div>

                {/* Arrow */}
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
