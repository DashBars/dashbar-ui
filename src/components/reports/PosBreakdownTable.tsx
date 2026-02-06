import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { PosBreakdown } from '@/lib/api/types';
import { CreditCard, Clock } from 'lucide-react';

interface PosBreakdownTableProps {
  data: PosBreakdown[];
}

function formatCurrency(cents: number): string {
  const dollars = cents / 100;
  return `$${dollars.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function PosBreakdownTable({ data }: PosBreakdownTableProps) {
  // Calculate totals
  const totals = data.reduce(
    (acc, pos) => ({
      revenue: acc.revenue + pos.totalRevenue,
      transactions: acc.transactions + pos.totalTransactions,
      units: acc.units + pos.totalUnitsSold,
    }),
    { revenue: 0, transactions: 0, units: 0 }
  );

  // Sort by revenue
  const sortedData = [...data].sort((a, b) => b.totalRevenue - a.totalRevenue);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Rendimiento por Terminal POS
        </CardTitle>
        <CardDescription>
          Métricas detalladas por cada terminal de punto de venta
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Barra</TableHead>
                  <TableHead className="text-right">Ingresos</TableHead>
                  <TableHead className="text-right">Transacciones</TableHead>
                  <TableHead className="text-right">Unidades</TableHead>
                  <TableHead className="text-right">Ticket Prom.</TableHead>
                  <TableHead>Hora Pico</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((pos, index) => {
                  const peakHour = pos.busiestHours[0];
                  return (
                    <TableRow key={pos.posnetId}>
                      <TableCell className="font-mono text-sm">{pos.posnetCode}</TableCell>
                      <TableCell className="font-medium">{pos.posnetName}</TableCell>
                      <TableCell>{pos.barName}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {index === 0 && (
                            <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-0.5 rounded">
                              Top
                            </span>
                          )}
                          {formatCurrency(pos.totalRevenue)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">{pos.totalTransactions}</TableCell>
                      <TableCell className="text-right">{pos.totalUnitsSold}</TableCell>
                      <TableCell className="text-right">{formatCurrency(pos.avgTicketSize)}</TableCell>
                      <TableCell>
                        {peakHour && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatTime(peakHour.hour)}
                            <span className="text-xs">
                              ({peakHour.transactions} trans.)
                            </span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {/* Totals row */}
                <TableRow className="bg-slate-50 dark:bg-slate-900 font-bold">
                  <TableCell>TOTAL</TableCell>
                  <TableCell colSpan={2}>{data.length} terminales</TableCell>
                  <TableCell className="text-right">{formatCurrency(totals.revenue)}</TableCell>
                  <TableCell className="text-right">{totals.transactions}</TableCell>
                  <TableCell className="text-right">{totals.units}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(totals.transactions > 0 ? totals.revenue / totals.transactions : 0)}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No hay datos de terminales POS disponibles
          </div>
        )}
      </CardContent>
    </Card>
  );
}
