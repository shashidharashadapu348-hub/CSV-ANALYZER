import { lazy, Suspense, useDeferredValue } from 'react';
import { useEquipmentData } from '@/hooks/useEquipmentData';
import { CSVUploader } from '@/components/equipment/CSVUploader';
import { SummaryCards } from '@/components/equipment/SummaryCards';
import { EquipmentTable } from '@/components/equipment/EquipmentTable';
import { EquipmentCharts } from '@/components/equipment/EquipmentCharts';
import { MetricHistograms } from '@/components/equipment/MetricHistograms';
import { TextReport } from '@/components/equipment/TextReport';
import { DatasetHistory } from '@/components/equipment/DatasetHistory';
import { ThemeToggle } from '@/components/ThemeToggle';

const NLPAnalysis = lazy(() =>
  import('@/components/equipment/NLPAnalysis').then((m) => ({ default: m.NLPAnalysis })),
);

export default function EquipmentAnalyzer() {
  const {
    datasets,
    currentDataset,
    currentItems,
    isLoading,
    uploadCSV,
    selectDataset,
    deleteDataset,
  } = useEquipmentData();

  const deferredItems = useDeferredValue(currentItems);
  const showAnalysis = deferredItems.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="CSV Analyzer logo" className="h-8 w-8 object-contain" />
            <div>
              <h1 className="text-xl font-bold">CSV Analyzer</h1>
              <p className="text-sm text-muted-foreground">Upload, analyze, and visualize any CSV data</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CSVUploader onUpload={uploadCSV} isLoading={isLoading} />
          </div>
          <div>
            <DatasetHistory
              datasets={datasets}
              currentDataset={currentDataset}
              onSelect={selectDataset}
              onDelete={deleteDataset}
            />
          </div>
        </div>

        <SummaryCards dataset={currentDataset} />

        {showAnalysis && (
          <>
            <EquipmentCharts dataset={currentDataset} items={deferredItems} />
            <MetricHistograms items={deferredItems} />
            <TextReport dataset={currentDataset} items={deferredItems} />
            <Suspense
              fallback={
                <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
                  Loading NLP analysis…
                </div>
              }
            >
              <NLPAnalysis items={deferredItems} />
            </Suspense>
            <EquipmentTable items={deferredItems} isLoading={isLoading} />
          </>
        )}
      </main>
    </div>
  );
}
