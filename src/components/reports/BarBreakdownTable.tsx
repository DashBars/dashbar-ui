import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { BarBreakdown } from '@/lib/api/types';
import { Store, ChevronDown, ChevronUp, TrendingUp, TrendingDown } from 'lucide-react';

interface BarBreakdownTableProps {
  data: BarBreakdown[];
}

function formatCurrency(cents: number): string {
  const dollars = cents / 100;
  return `$${dollars.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

const barTypeLabels: Record<string, string> = {
  VIP: 'VIP',
  general: 'General',
  backstage: 'Backstage',
  lounge: 'Lounge',
};

const barTypeColors: Record<string, string> = {
  VIP: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  general: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  backstage: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  lounge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
};

export function BarBreakdownTable({ data }: BarBreakdownTableProps) {
  const [expandedBar, setExpandedBar] = useState<number | null>(null);

  // Calculate totals
  const totals = data.reduce(
    (acc, bar) => ({
      revenue: acc.revenue + bar.totalRevenue,
      cogs: acc.cogs + bar.totalCOGS,
      profit: acc.profit + bar.grossProfit,
      units: acc.units + bar.totalUnitsSold,
      orders: acc.orders + bar.totalOrderCount,
    }),
    { revenue: 0, cogs: 0, profit: 0, units: 0, orders: 0 }
  );

  // Find best and worst performing bars
  const sortedByProfit = [...data].sort((a, b) => b.grossProfit - a.grossProfit);
  const bestBar = sortedByProfit[0];
  const worstBar = sortedByProfit[sortedByProfit.length - 1];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="h-5 w-5" />
          Rendimiento por Barra
        </CardTitle>
        <CardDescription>
          Desglose detallado de métricas por cada barra del evento
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <>
            {/* Quick insights */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {bestBar && (
                <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm font-medium">Mejor rendimiento</span>
                  </div>
                  <div className="mt-1 font-bold">{bestBar.barName}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatCurrency(bestBar.grossProfit)} ganancia ({bestBar.marginPercent}% margen)
                  </div>
                </div>
              )}
              {worstBar && data.length > 1 && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                    <TrendingDown className="h-4 w-4" />
                    <span className="text-sm font-medium">Menor rendimiento</span>
                  </div>
                  <div className="mt-1 font-bold">{worstBar.barName}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatCurrency(worstBar.grossProfit)} ganancia ({worstBar.marginPercent}% margen)
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Barra</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Ingresos</TableHead>
                    <TableHead className="text-right">COGS</TableHead>
                    <TableHead className="text-right">Ganancia</TableHead>
                    <TableHead className="text-right">Margen</TableHead>
                    <TableHead className="text-right">Órdenes</TableHead>
                    <TableHead className="text-right">Ticket Prom.</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((bar) => (
                    <>
                      <TableRow key={bar.barId}>
                        <TableCell className="font-medium">{bar.barName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={barTypeColors[bar.barType] || ''}>
                            {barTypeLabels[bar.barType] || bar.barType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(bar.totalRevenue)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(bar.totalCOGS)}</TableCell>
                        <TableCell className="text-right font-medium">
                          <span className={bar.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(bar.grossProfit)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={bar.marginPercent >= 30 ? 'text-green-600' : bar.marginPercent >= 15 ? 'text-yellow-600' : 'text-red-600'}>
                            {bar.marginPercent.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right">{bar.totalOrderCount}</TableCell>
                        <TableCell className="text-right">{formatCurrency(bar.avgTicketSize)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedBar(expandedBar === bar.barId ? null : bar.barId)}
                          >
                            {expandedBar === bar.barId ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                      {expandedBar === bar.barId && (
                        <TableRow>
                          <TableCell colSpan={9} className="bg-slate-50 dark:bg-slate-900">
                            <div className="p-4">
                              <h4 className="font-medium mb-3">Top productos en {bar.barName}</h4>
                              <div className="grid grid-cols-3 gap-4">
                                {bar.topProducts.slice(0, 3).map((product, index) => (
                                  <div
                                    key={product.name}
                                    className="p-3 bg-white dark:bg-slate-800 rounded-lg border"
                                  >
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                                        index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-slate-400' : 'bg-amber-700'
                                      }`}>
                                        {index + 1}
                                      </span>
                                      <span className="font-medium text-sm truncate">{product.name}</span>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {product.unitsSold} unid. • {formatCurrency(product.revenue)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                  {/* Totals row */}
                  <TableRow className="bg-slate-50 dark:bg-slate-900 font-bold">
                    <TableCell>TOTAL</TableCell>
                    <TableCell></TableCell>
                    <TableCell className="text-right">{formatCurrency(totals.revenue)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(totals.cogs)}</TableCell>
                    <TableCell className="text-right">
                      <span className={totals.profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(totals.profit)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {totals.revenue > 0 ? ((totals.profit / totals.revenue) * 100).toFixed(1) : 0}%
                    </TableCell>
                    <TableCell className="text-right">{totals.orders}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(totals.orders > 0 ? totals.revenue / totals.orders : 0)}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No hay datos de barras disponibles
          </div>
        )}
      </CardContent>
    </Card>
  );
}
