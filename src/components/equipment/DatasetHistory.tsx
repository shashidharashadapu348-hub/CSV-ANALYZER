import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EquipmentDataset } from '@/types/equipment';
import { History, Trash2, FileText } from 'lucide-react';
import { format } from 'date-fns';

interface DatasetHistoryProps {
  datasets: EquipmentDataset[];
  currentDataset: EquipmentDataset | null;
  onSelect: (dataset: EquipmentDataset) => void;
  onDelete: (id: string) => void;
}

export function DatasetHistory({ datasets, currentDataset, onSelect, onDelete }: DatasetHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Upload History (Last 5)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {datasets.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No datasets uploaded yet
          </p>
        ) : (
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {datasets.map((dataset) => (
                <div
                  key={dataset.id}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    currentDataset?.id === dataset.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/50'
                  }`}
                  onClick={() => onSelect(dataset)}
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{dataset.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {dataset.total_count} items • {format(new Date(dataset.uploaded_at), 'MMM d, yyyy HH:mm')}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(dataset.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
