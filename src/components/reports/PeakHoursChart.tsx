import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { PeakHourBucketEntry, BucketSize } from '@/lib/api/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Clock, TrendingUp, DollarSign } from 'lucide-react';

interface PeakHoursChartProps {
  data: {
    '5min': PeakHourBucketEntry[];
    '15min': PeakHourBucketEntry[];
    '60min': PeakHourBucketEntry[];
  };
  selectedBucket: BucketSize;
  onBucketChange: (bucket: BucketSize) => void;
}

const bucketDescriptions: Record<BucketSize, { label: string; description: string }> = {
  5: {
    label: '5 minutos',
    description: 'Más detallado - ve los momentos exactos de mayor demanda',
  },
  15: {
    label: '15 minutos',
    description: 'Vista equilibrada - ideal para eventos medianos',
  },
  60: {
    label: '60 minutos',
    description: 'Resumen por hora - mejor para eventos largos',
  },
};

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCurrency(cents: number): string {
  const dollars = cents / 100;
  return `$${dollars.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// Custom tooltip component
const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as PeakHourBucketEntry & { timeLabel: string };
    return (
      <div className="bg-white dark:bg-slate-900 p-3 border rounded-lg shadow-lg">
        <p className="font-medium text-sm">{data.timeLabel}</p>
        <div className="mt-2 space-y-1 text-sm">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-3 w-3 text-blue-500" />
            <span className="text-muted-foreground">Ventas:</span>
            <span className="font-medium">{data.salesCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-3 w-3 text-green-500" />
            <span className="text-muted-foreground">Ingresos:</span>
            <span className="font-medium">{formatCurrency(data.revenue)}</span>
          </div>
          {data.topProduct && (
            <div className="pt-1 border-t text-xs text-muted-foreground">
              Top: {data.topProduct}
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export function PeakHoursChart({ data, selectedBucket, onBucketChange }: PeakHoursChartProps) {
  const bucketKey = `${selectedBucket}min` as '5min' | '15min' | '60min';
  const chartData = data[bucketKey] || [];

  // Transform data for the chart
  const transformedData = chartData.map((entry) => ({
    ...entry,
    timeLabel: `${formatTime(entry.startTime)} - ${formatTime(entry.endTime)}`,
  }));

  // Sort by time
  transformedData.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  // Find peak entry
  const peakEntry = transformedData.reduce(
    (max, entry) => (entry.salesCount > (max?.salesCount || 0) ? entry : max),
    transformedData[0]
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Análisis de Horas Pico
            </CardTitle>
            <CardDescription>
              Distribución de ventas a lo largo del evento
            </CardDescription>
          </div>
          <div className="w-48">
            <Select
              value={selectedBucket.toString()}
              onValueChange={(value) => onBucketChange(parseInt(value) as BucketSize)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar intervalo" />
              </SelectTrigger>
              <SelectContent>
                {([5, 15, 60] as BucketSize[]).map((bucket) => (
                  <SelectItem key={bucket} value={bucket.toString()}>
                    <div className="flex flex-col items-start">
                      <span>{bucketDescriptions[bucket].label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {bucketDescriptions[selectedBucket].description}
        </p>
      </CardHeader>
      <CardContent>
        {transformedData.length > 0 ? (
          <>
            {/* Peak indicator */}
            {peakEntry && (
              <div className="mb-4 p-3 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/30 dark:to-yellow-950/30 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                  <TrendingUp className="h-4 w-4" />
                  <span className="font-medium">Momento pico:</span>
                  <span>{peakEntry.timeLabel}</span>
                  <span className="text-muted-foreground">•</span>
                  <span>{peakEntry.salesCount} ventas</span>
                  <span className="text-muted-foreground">•</span>
                  <span>{formatCurrency(peakEntry.revenue)}</span>
                </div>
              </div>
            )}

            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={transformedData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                  <XAxis
                    dataKey="timeLabel"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => value.toString()}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="salesCount"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorSales)"
                    name="Ventas"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No hay datos de ventas para mostrar
          </div>
        )}
      </CardContent>
    </Card>
  );
}
