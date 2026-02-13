import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Monitor, Activity, TrendingUp, AlertTriangle } from 'lucide-react';
import { useEventPosnets } from '@/hooks/usePosnets';
import { PosTable } from './PosTable';
import { PosFormDialog } from './PosFormDialog';
import type { Posnet } from '@/lib/api/types';

interface PosManagementTabProps {
  eventId: number;
}

export function PosManagementTab({ eventId }: PosManagementTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPosnet, setEditingPosnet] = useState<Posnet | null>(null);

  const { data: posnets = [], isLoading } = useEventPosnets(eventId);

  // Calculate stats
  const openCount = posnets.filter((p) => p.status === 'OPEN').length;
  const congestedCount = posnets.filter((p) => p.status === 'CONGESTED').length;
  const avgTraffic =
    posnets.length > 0
      ? Math.round(posnets.reduce((sum, p) => sum + p.traffic, 0) / posnets.length)
      : 0;

  const handleEdit = (posnet: Posnet) => {
    setEditingPosnet(posnet);
    setDialogOpen(true);
  };

  const handleCloseDialog = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingPosnet(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  const trafficColor =
    avgTraffic > 80 ? 'text-red-500' : avgTraffic > 50 ? 'text-yellow-500' : 'text-green-500';

  return (
    <div className="space-y-6">
      {/* Compact Stats */}
      <Card className="rounded-2xl">
        <CardContent className="px-5 py-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {/* Total */}
            <div className="flex items-center gap-2.5">
              <Monitor className="h-4.5 w-4.5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground leading-none">Terminales</p>
                <p className="text-lg font-bold leading-tight">{posnets.length}</p>
              </div>
            </div>

            <div className="h-8 w-px bg-border" />

            {/* Open */}
            <div className="flex items-center gap-2.5">
              <Activity className="h-4.5 w-4.5 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground leading-none">Abiertos</p>
                <div className="flex items-center gap-1.5">
                  <p className="text-lg font-bold leading-tight">{openCount}</p>
                  {openCount > 0 && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-green-500/10 text-green-600 border-green-500/20">
                      Activo
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="h-8 w-px bg-border" />

            {/* Congested */}
            <div className="flex items-center gap-2.5">
              <AlertTriangle className={`h-4.5 w-4.5 ${congestedCount > 0 ? 'text-yellow-500' : 'text-muted-foreground/40'}`} />
              <div>
                <p className="text-xs text-muted-foreground leading-none">Congestionados</p>
                <div className="flex items-center gap-1.5">
                  <p className="text-lg font-bold leading-tight">{congestedCount}</p>
                  {congestedCount > 0 && (
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                      Alerta
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="h-8 w-px bg-border" />

            {/* Avg Traffic */}
            <div className="flex items-center gap-2.5">
              <TrendingUp className={`h-4.5 w-4.5 ${trafficColor}`} />
              <div>
                <p className="text-xs text-muted-foreground leading-none">Tráfico Prom.</p>
                <p className={`text-lg font-bold leading-tight ${trafficColor}`}>{avgTraffic}%</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* POS List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Terminales POS</CardTitle>
            <CardDescription>
              Gestioná terminales POS para este evento
            </CardDescription>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Agregar Terminal
          </Button>
        </CardHeader>
        <CardContent>
          <PosTable posnets={posnets} eventId={eventId} onEdit={handleEdit} />
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <PosFormDialog
        open={dialogOpen}
        onOpenChange={handleCloseDialog}
        eventId={eventId}
        editingPosnet={editingPosnet}
      />
    </div>
  );
}
