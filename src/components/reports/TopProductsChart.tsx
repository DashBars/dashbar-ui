import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { TopProductEntry } from '@/lib/api/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, ShoppingBag, DollarSign, Percent } from 'lucide-react';

interface TopProductsChartProps {
  data: TopProductEntry[];
  limit?: number;
}

function formatCurrency(cents: number): string {
  const dollars = cents / 100;
  return `$${dollars.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// Colors for the bars (gradient from primary to lighter)
const COLORS = [
  '#3b82f6', // Blue 500
  '#60a5fa', // Blue 400
  '#93c5fd', // Blue 300
  '#bfdbfe', // Blue 200
  '#dbeafe', // Blue 100
  '#eff6ff', // Blue 50
  '#e2e8f0', // Slate 200
  '#cbd5e1', // Slate 300
  '#94a3b8', // Slate 400
  '#64748b', // Slate 500
];

// Custom tooltip component
const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as TopProductEntry;
    return (
      <div className="bg-white dark:bg-slate-900 p-3 border rounded-lg shadow-lg">
        <p className="font-medium text-sm mb-2">{data.name}</p>
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-3 w-3 text-blue-500" />
            <span className="text-muted-foreground">Unidades:</span>
            <span className="font-medium">{data.unitsSold.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-3 w-3 text-green-500" />
            <span className="text-muted-foreground">Ingresos:</span>
            <span className="font-medium">{formatCurrency(data.revenue)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Percent className="h-3 w-3 text-orange-500" />
            <span className="text-muted-foreground">% del total:</span>
            <span className="font-medium">{data.sharePercent}%</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export function TopProductsChart({ data, limit = 10 }: TopProductsChartProps) {
  const chartData = data.slice(0, limit);

  // Calculate totals
  const totalUnits = chartData.reduce((sum, item) => sum + item.unitsSold, 0);
  const totalRevenue = chartData.reduce((sum, item) => sum + item.revenue, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Productos Más Vendidos
        </CardTitle>
        <CardDescription>
          Top {chartData.length} productos por cantidad de ventas
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <div className="text-sm text-muted-foreground">Total Unidades</div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {totalUnits.toLocaleString()}
                </div>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                <div className="text-sm text-muted-foreground">Total Ingresos</div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(totalRevenue)}
                </div>
              </div>
            </div>

            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" horizontal={true} vertical={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => value.toLocaleString()}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={100}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="unitsSold" radius={[0, 4, 4, 0]}>
                    {chartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Rankings list */}
            <div className="mt-6 space-y-2">
              {chartData.slice(0, 3).map((product, index) => (
                <div
                  key={product.cocktailId || product.name}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                        index === 0
                          ? 'bg-yellow-500'
                          : index === 1
                          ? 'bg-slate-400'
                          : 'bg-amber-700'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <span className="font-medium">{product.name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">
                      {product.unitsSold.toLocaleString()} unid.
                    </span>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {formatCurrency(product.revenue)}
                    </span>
                    <span className="text-muted-foreground">
                      {product.sharePercent}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No hay datos de productos para mostrar
          </div>
        )}
      </CardContent>
    </Card>
  );
}
