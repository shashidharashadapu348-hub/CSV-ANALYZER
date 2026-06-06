import { useState, useEffect } from 'react';
import { hasSupabaseConfig, supabase } from '@/integrations/supabase/client';
import { EquipmentDataset, EquipmentItem, EquipmentTypeCount } from '@/types/equipment';
import { useToast } from '@/hooks/use-toast';

function parseCSVFile(text: string, fileName: string): EquipmentItem[] {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

  if (headers.length === 0 || lines.length < 2) {
    throw new Error('CSV file is empty or invalid');
  }

  let nameIdx = headers.findIndex(
    (h) => h.includes('name') || h.includes('equipment') || h.includes('id') || h.includes('item'),
  );
  let typeIdx = headers.findIndex(
    (h) => h.includes('type') || h.includes('category') || h.includes('class'),
  );
  let flowIdx = headers.findIndex((h) => h.includes('flow'));
  let pressIdx = headers.findIndex((h) => h.includes('press'));
  let tempIdx = headers.findIndex((h) => h.includes('temp'));

  const rawRows = lines
    .slice(1)
    .map((l) => l.split(',').map((v) => v.trim()))
    .filter((v) => v.some((c) => c !== ''));

  const numericCols: number[] = [];
  for (let c = 0; c < headers.length; c++) {
    const vals = rawRows.map((r) => r[c]).filter((v) => v !== undefined && v !== '');
    if (!vals.length) continue;
    const numCount = vals.filter((v) => !isNaN(parseFloat(v)) && isFinite(Number(v))).length;
    if (numCount / vals.length >= 0.6) numericCols.push(c);
  }

  if (nameIdx === -1) {
    nameIdx = headers.findIndex((_, i) => !numericCols.includes(i));
    if (nameIdx === -1) nameIdx = 0;
  }
  if (typeIdx === -1) {
    typeIdx = headers.findIndex((_, i) => i !== nameIdx && !numericCols.includes(i));
  }

  const remainingNumeric = numericCols.filter((i) => i !== flowIdx && i !== pressIdx && i !== tempIdx);
  if (flowIdx === -1 && remainingNumeric.length) flowIdx = remainingNumeric.shift()!;
  if (pressIdx === -1 && remainingNumeric.length) pressIdx = remainingNumeric.shift()!;
  if (tempIdx === -1 && remainingNumeric.length) tempIdx = remainingNumeric.shift()!;

  const items: EquipmentItem[] = [];
  for (let i = 0; i < rawRows.length; i++) {
    const values = rawRows[i];
    const name = nameIdx !== -1 && values[nameIdx] ? values[nameIdx] : `Row ${i + 1}`;
    const type = typeIdx !== -1 && values[typeIdx] ? values[typeIdx] : headers[flowIdx] || 'Data';
    items.push({
      equipment_name: name,
      equipment_type: type,
      flowrate: flowIdx !== -1 ? parseFloat(values[flowIdx]) || null : null,
      pressure: pressIdx !== -1 ? parseFloat(values[pressIdx]) || null : null,
      temperature: tempIdx !== -1 ? parseFloat(values[tempIdx]) || null : null,
    });
  }

  if (!items.length) {
    throw new Error('No data rows found in CSV');
  }

  return items;
}

function buildDatasetSummary(fileName: string, items: EquipmentItem[]): EquipmentDataset {
  const validFlowrates = items.filter((i) => i.flowrate !== null).map((i) => i.flowrate!);
  const validPressures = items.filter((i) => i.pressure !== null).map((i) => i.pressure!);
  const validTemps = items.filter((i) => i.temperature !== null).map((i) => i.temperature!);

  const avgFlowrate =
    validFlowrates.length > 0 ? validFlowrates.reduce((a, b) => a + b, 0) / validFlowrates.length : null;
  const avgPressure =
    validPressures.length > 0 ? validPressures.reduce((a, b) => a + b, 0) / validPressures.length : null;
  const avgTemperature =
    validTemps.length > 0 ? validTemps.reduce((a, b) => a + b, 0) / validTemps.length : null;

  const typeCounts: Record<string, number> = {};
  items.forEach((item) => {
    typeCounts[item.equipment_type] = (typeCounts[item.equipment_type] || 0) + 1;
  });
  const equipmentTypes: EquipmentTypeCount[] = Object.entries(typeCounts).map(([type, count]) => ({
    type,
    count,
  }));

  return {
    id: crypto.randomUUID(),
    filename: fileName,
    uploaded_at: new Date().toISOString(),
    total_count: items.length,
    avg_flowrate: avgFlowrate,
    avg_pressure: avgPressure,
    avg_temperature: avgTemperature,
    equipment_types: equipmentTypes,
  };
}

export function useEquipmentData() {
  const [datasets, setDatasets] = useState<EquipmentDataset[]>([]);
  const [currentDataset, setCurrentDataset] = useState<EquipmentDataset | null>(null);
  const [currentItems, setCurrentItems] = useState<EquipmentItem[]>([]);
  const [localItemsByDatasetId, setLocalItemsByDatasetId] = useState<Record<string, EquipmentItem[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchDatasets = async () => {
    if (!supabase) {
      if (!hasSupabaseConfig) {
        console.warn('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to enable persistence.');
      }
      return;
    }

    const { data, error } = await supabase
      .from('equipment_datasets')
      .select('*')
      .order('uploaded_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching datasets:', error);
      return;
    }

    const typedData = (data || []).map(d => ({
      ...d,
      equipment_types: (d.equipment_types as unknown as EquipmentTypeCount[]) || []
    }));
    
    setDatasets(typedData);
    if (typedData.length > 0 && !currentDataset) {
      selectDataset(typedData[0]);
    }
  };

  const selectDataset = async (dataset: EquipmentDataset) => {
    setCurrentDataset(dataset);

    if (!supabase) {
      setCurrentItems(localItemsByDatasetId[dataset.id] || []);
      return;
    }

    setIsLoading(true);

    const { data, error } = await supabase
      .from('equipment_items')
      .select('*')
      .eq('dataset_id', dataset.id);

    if (error) {
      console.error('Error fetching items:', error);
      setIsLoading(false);
      return;
    }

    setCurrentItems(data || []);
    setIsLoading(false);
  };

  const uploadCSV = async (file: File) => {
    setIsLoading(true);

    try {
      const text = await file.text();
      const items = parseCSVFile(text, file.name);

      if (!supabase) {
        const dataset = buildDatasetSummary(file.name, items);
        const itemsWithDatasetId = items.map((item) => ({ ...item, dataset_id: dataset.id }));

        setLocalItemsByDatasetId((prev) => ({ ...prev, [dataset.id]: itemsWithDatasetId }));
        setDatasets((prev) => [dataset, ...prev].slice(0, 5));
        setCurrentDataset(dataset);
        setCurrentItems(itemsWithDatasetId);

        toast({
          title: 'Upload Successful',
          description: `Loaded ${items.length} records from ${file.name} (browser session only)`,
        });
        return;
      }

      const equipmentTypes = buildDatasetSummary(file.name, items).equipment_types;
      const validFlowrates = items.filter((i) => i.flowrate !== null).map((i) => i.flowrate!);
      const validPressures = items.filter((i) => i.pressure !== null).map((i) => i.pressure!);
      const validTemps = items.filter((i) => i.temperature !== null).map((i) => i.temperature!);

      const avgFlowrate =
        validFlowrates.length > 0 ? validFlowrates.reduce((a, b) => a + b, 0) / validFlowrates.length : null;
      const avgPressure =
        validPressures.length > 0 ? validPressures.reduce((a, b) => a + b, 0) / validPressures.length : null;
      const avgTemperature =
        validTemps.length > 0 ? validTemps.reduce((a, b) => a + b, 0) / validTemps.length : null;

      const { data: datasetData, error: datasetError } = await supabase
        .from('equipment_datasets')
        .insert([
          {
            filename: file.name,
            total_count: items.length,
            avg_flowrate: avgFlowrate,
            avg_pressure: avgPressure,
            avg_temperature: avgTemperature,
            equipment_types: JSON.parse(JSON.stringify(equipmentTypes)),
          },
        ])
        .select()
        .single();

      if (datasetError) throw datasetError;

      const itemsWithDatasetId = items.map((item) => ({
        ...item,
        dataset_id: datasetData.id,
      }));

      const { error: itemsError } = await supabase.from('equipment_items').insert(itemsWithDatasetId);

      if (itemsError) throw itemsError;

      toast({
        title: 'Upload Successful',
        description: `Loaded ${items.length} equipment records from ${file.name}`,
      });

      await fetchDatasets();

      const newDataset = {
        ...datasetData,
        equipment_types: equipmentTypes,
      };
      selectDataset(newDataset);
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Failed to parse CSV file',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteDataset = async (id: string) => {
    if (!supabase) {
      setDatasets((prev) => prev.filter((dataset) => dataset.id !== id));
      setLocalItemsByDatasetId((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });

      if (currentDataset?.id === id) {
        setCurrentDataset(null);
        setCurrentItems([]);
      }

      toast({
        title: 'Dataset Deleted',
        description: 'Dataset has been removed from this session',
      });
      return;
    }

    const { error } = await supabase
      .from('equipment_datasets')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete dataset',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Dataset Deleted',
      description: 'Dataset has been removed',
    });

    if (currentDataset?.id === id) {
      setCurrentDataset(null);
      setCurrentItems([]);
    }
    
    fetchDatasets();
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  return {
    datasets,
    currentDataset,
    currentItems,
    isLoading,
    uploadCSV,
    selectDataset,
    deleteDataset,
    refreshDatasets: fetchDatasets,
  };
}
