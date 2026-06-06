import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EquipmentItem } from '@/types/equipment';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { BarChart3 } from 'lucide-react';

interface Props {
  items: EquipmentItem[];
}

const METRICS: { key: 'flowrate' | 'pressure' | 'temperature'; label: string; color: string }[] = [
  { key: 'flowrate', label: 'Flowrate', color: 'hsl(var(--primary))' },
  { key: 'pressure', label: 'Pressure', color: '#f59e0b' },
  { key: 'temperature', label: 'Temperature', color: '#ef4444' },
];

function buildHistogram(values: number[], bins = 10) {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return [{ range: min.toFixed(2), count: values.length }];
  const step = (max - min) / bins;
  const buckets = Array.from({ length: bins }, (_, i) => ({
    range: `${(min + i * step).toFixed(1)}–${(min + (i + 1) * step).toFixed(1)}`,
    count: 0,
  }));
  values.forEach((v) => {
    let idx = Math.floor((v - min) / step);
    if (idx >= bins) idx = bins - 1;
    buckets[idx].count++;
  });
  return buckets;
}

export function MetricHistograms({ items }: Props) {
  const available = METRICS.filter((m) => items.some((i) => i[m.key] !== null));
  if (!items.length || !available.length) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {available.map((m) => {
        const values = items.map((i) => i[m.key]).filter((v): v is number => v !== null);
        const data = buildHistogram(values);
        return (
          <Card key={m.key}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4" />
                {m.label} Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={60} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill={m.color} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
