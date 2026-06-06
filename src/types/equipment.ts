export interface EquipmentItem {
  id?: string;
  dataset_id?: string;
  equipment_name: string;
  equipment_type: string;
  flowrate: number | null;
  pressure: number | null;
  temperature: number | null;
  created_at?: string;
}

export interface EquipmentDataset {
  id: string;
  user_id?: string;
  filename: string;
  uploaded_at: string;
  total_count: number;
  avg_flowrate: number | null;
  avg_pressure: number | null;
  avg_temperature: number | null;
  equipment_types: EquipmentTypeCount[];
}

export interface EquipmentTypeCount {
  type: string;
  count: number;
}

export interface DatasetSummary {
  totalCount: number;
  avgFlowrate: number | null;
  avgPressure: number | null;
  avgTemperature: number | null;
  equipmentTypes: EquipmentTypeCount[];
}
