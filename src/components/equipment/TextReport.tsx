import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EquipmentDataset, EquipmentItem } from '@/types/equipment';
import { FileText } from 'lucide-react';

interface Props {
  dataset: EquipmentDataset | null;
  items: EquipmentItem[];
}

function stats(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const mean = sorted.reduce((a, b) => a + b, 0) / n;
  const median = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
  const variance = sorted.reduce((acc, v) => acc + (v - mean) ** 2, 0) / n;
  const std = Math.sqrt(variance);
  return { min: sorted[0], max: sorted[n - 1], mean, median, std, count: n };
}

const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 2 });

export function TextReport({ dataset, items }: Props) {
  if (!dataset || !items.length) return null;

  const metrics: { key: 'flowrate' | 'pressure' | 'temperature'; label: string }[] = [
    { key: 'flowrate', label: 'Flowrate' },
    { key: 'pressure', label: 'Pressure' },
    { key: 'temperature', label: 'Temperature' },
  ];

  const typeCounts: Record<string, number> = {};
  items.forEach((i) => {
    typeCounts[i.equipment_type] = (typeCounts[i.equipment_type] || 0) + 1;
  });
  const topTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const lines: string[] = [];
  lines.push(`Dataset: ${dataset.filename}`);
  lines.push(`Uploaded: ${new Date(dataset.uploaded_at).toLocaleString()}`);
  lines.push(`Total records: ${items.length}`);
  lines.push(`Unique categories: ${Object.keys(typeCounts).length}`);
  lines.push('');
  lines.push('Top categories:');
  topTypes.forEach(([t, c]) => {
    lines.push(`  • ${t}: ${c} (${((c / items.length) * 100).toFixed(1)}%)`);
  });
  lines.push('');

  metrics.forEach((m) => {
    const vals = items.map((i) => i[m.key]).filter((v): v is number => v !== null);
    const s = stats(vals);
    if (!s) return;
    lines.push(`${m.label}:`);
    lines.push(`  count=${s.count}  min=${fmt(s.min)}  max=${fmt(s.max)}`);
    lines.push(`  mean=${fmt(s.mean)}  median=${fmt(s.median)}  std=${fmt(s.std)}`);
    lines.push('');
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4" />
          Text Report
        </CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="text-xs font-mono bg-muted/40 rounded-md p-4 overflow-x-auto whitespace-pre-wrap leading-relaxed">
{lines.join('\n')}
        </pre>
      </CardContent>
    </Card>
  );
}
