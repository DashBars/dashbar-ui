import { Card, CardContent } from '@/components/ui/card';
import type { ReportSummary } from '@/lib/api/types';
import { DollarSign, TrendingUp, Package, ShoppingCart, Receipt, Percent } from 'lucide-react';

interface ReportSummaryCardsProps {
  summary: ReportSummary;
}

function formatCurrency(cents: number): string {
  const dollars = cents / 100;
  return `$${dollars.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function ReportSummaryCards({ summary }: ReportSummaryCardsProps) {
  const avgTicket = summary.totalOrderCount > 0 
    ? summary.totalRevenue / summary.totalOrderCount 
    : 0;

  const cards = [
    {
      title: 'Ingresos Totales',
      value: formatCurrency(summary.totalRevenue),
      icon: DollarSign,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950/30',
    },
    {
      title: 'Costo de Ventas',
      value: formatCurrency(summary.totalCOGS),
      icon: Receipt,
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-50 dark:bg-red-950/30',
    },
    {
      title: 'Ganancia Bruta',
      value: formatCurrency(summary.grossProfit),
      icon: TrendingUp,
      color: summary.grossProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400',
      bgColor: summary.grossProfit >= 0 ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-red-50 dark:bg-red-950/30',
    },
    {
      title: 'Margen',
      value: `${summary.marginPercent.toFixed(1)}%`,
      icon: Percent,
      color: summary.marginPercent >= 30 ? 'text-green-600 dark:text-green-400' : summary.marginPercent >= 15 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400',
      bgColor: summary.marginPercent >= 30 ? 'bg-green-50 dark:bg-green-950/30' : summary.marginPercent >= 15 ? 'bg-yellow-50 dark:bg-yellow-950/30' : 'bg-red-50 dark:bg-red-950/30',
    },
    {
      title: 'Unidades Vendidas',
      value: summary.totalUnitsSold.toLocaleString(),
      icon: Package,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    },
    {
      title: 'Ticket Promedio',
      value: formatCurrency(avgTicket),
      icon: ShoppingCart,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className={card.bgColor}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <card.icon className={`h-4 w-4 ${card.color}`} />
              <span className="text-xs text-muted-foreground">{card.title}</span>
            </div>
            <div className={`text-xl font-bold ${card.color}`}>
              {card.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
