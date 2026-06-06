import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EquipmentItem } from '@/types/equipment';
import { TableIcon } from 'lucide-react';

interface EquipmentTableProps {
  items: EquipmentItem[];
  isLoading: boolean;
}

export function EquipmentTable({ items, isLoading }: EquipmentTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TableIcon className="h-5 w-5" />
            Equipment Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TableIcon className="h-5 w-5" />
            Equipment Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No equipment data. Upload a CSV file to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TableIcon className="h-5 w-5" />
          Equipment Data ({items.length} items)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipment Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Flowrate (m³/h)</TableHead>
                <TableHead className="text-right">Pressure (bar)</TableHead>
                <TableHead className="text-right">Temperature (°C)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={item.id || index}>
                  <TableCell className="font-medium">{item.equipment_name}</TableCell>
                  <TableCell>{item.equipment_type}</TableCell>
                  <TableCell className="text-right">
                    {item.flowrate?.toFixed(2) ?? '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.pressure?.toFixed(2) ?? '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {item.temperature?.toFixed(2) ?? '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
