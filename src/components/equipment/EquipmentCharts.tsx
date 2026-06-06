import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EquipmentDataset, EquipmentItem } from '@/types/equipment';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  ScatterChart,
  Scatter,
} from 'recharts';
import { BarChart3, PieChartIcon, ScatterChartIcon } from 'lucide-react';

interface EquipmentChartsProps {
  dataset: EquipmentDataset | null;
  items: EquipmentItem[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

export function EquipmentCharts({ dataset, items }: EquipmentChartsProps) {
  if (!dataset || items.length === 0) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Equipment Type Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">No data available</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Parameter Comparison
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">No data available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pieData = dataset.equipment_types.map((et) => ({
    name: et.type,
    value: et.count,
  }));

  // Create bar chart data for average values by type
  const typeStats: Record<string, { flowrate: number[]; pressure: number[]; temperature: number[] }> = {};
  items.forEach((item) => {
    if (!typeStats[item.equipment_type]) {
      typeStats[item.equipment_type] = { flowrate: [], pressure: [], temperature: [] };
    }
    if (item.flowrate !== null) typeStats[item.equipment_type].flowrate.push(item.flowrate);
    if (item.pressure !== null) typeStats[item.equipment_type].pressure.push(item.pressure);
    if (item.temperature !== null) typeStats[item.equipment_type].temperature.push(item.temperature);
  });

  const barData = Object.entries(typeStats).map(([type, stats]) => ({
    type,
    flowrate: stats.flowrate.length > 0 
      ? stats.flowrate.reduce((a, b) => a + b, 0) / stats.flowrate.length 
      : 0,
    pressure: stats.pressure.length > 0 
      ? stats.pressure.reduce((a, b) => a + b, 0) / stats.pressure.length 
      : 0,
    temperature: stats.temperature.length > 0 
      ? stats.temperature.reduce((a, b) => a + b, 0) / stats.temperature.length 
      : 0,
  }));

  // Scatter plot data for pressure vs temperature
  const scatterData = items
    .filter((item) => item.pressure !== null && item.temperature !== null)
    .map((item) => ({
      x: item.pressure,
      y: item.temperature,
      name: item.equipment_name,
    }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            Equipment Type Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Average Values by Type
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="flowrate" name="Flowrate (m³/h)" fill="hsl(var(--primary))" />
              <Bar dataKey="pressure" name="Pressure (bar)" fill="#f59e0b" />
              <Bar dataKey="temperature" name="Temperature (°C)" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScatterChartIcon className="h-5 w-5" />
            Pressure vs Temperature Correlation
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" dataKey="x" name="Pressure" unit=" bar" />
              <YAxis type="number" dataKey="y" name="Temperature" unit=" °C" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter name="Equipment" data={scatterData} fill="hsl(var(--primary))" />
            </ScatterChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
