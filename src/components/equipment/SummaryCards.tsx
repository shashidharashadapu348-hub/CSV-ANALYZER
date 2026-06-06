import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EquipmentDataset } from '@/types/equipment';
import { Gauge, Thermometer, Wind, Package } from 'lucide-react';

interface SummaryCardsProps {
  dataset: EquipmentDataset | null;
}

export function SummaryCards({ dataset }: SummaryCardsProps) {
  if (!dataset) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-24" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Equipment',
      value: dataset.total_count,
      icon: Package,
      color: 'text-blue-500',
    },
    {
      title: 'Avg Flowrate',
      value: dataset.avg_flowrate?.toFixed(2) ?? 'N/A',
      unit: 'm³/h',
      icon: Wind,
      color: 'text-green-500',
    },
    {
      title: 'Avg Pressure',
      value: dataset.avg_pressure?.toFixed(2) ?? 'N/A',
      unit: 'bar',
      icon: Gauge,
      color: 'text-orange-500',
    },
    {
      title: 'Avg Temperature',
      value: dataset.avg_temperature?.toFixed(2) ?? 'N/A',
      unit: '°C',
      icon: Thermometer,
      color: 'text-red-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {card.value}
              {card.unit && <span className="text-sm font-normal text-muted-foreground ml-1">{card.unit}</span>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
