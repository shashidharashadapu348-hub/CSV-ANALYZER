-- Create equipment_datasets table to store uploaded CSV data
CREATE TABLE public.equipment_datasets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  filename TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  total_count INTEGER NOT NULL DEFAULT 0,
  avg_flowrate DECIMAL,
  avg_pressure DECIMAL,
  avg_temperature DECIMAL,
  equipment_types JSONB DEFAULT '[]'::jsonb
);

-- Create equipment_items table to store individual equipment records
CREATE TABLE public.equipment_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dataset_id UUID NOT NULL REFERENCES public.equipment_datasets(id) ON DELETE CASCADE,
  equipment_name TEXT NOT NULL,
  equipment_type TEXT NOT NULL,
  flowrate DECIMAL,
  pressure DECIMAL,
  temperature DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.equipment_datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for equipment_datasets (allow both authenticated and anonymous access for demo)
CREATE POLICY "Anyone can view equipment datasets" 
ON public.equipment_datasets 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert equipment datasets" 
ON public.equipment_datasets 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can delete equipment datasets" 
ON public.equipment_datasets 
FOR DELETE 
USING (true);

-- RLS policies for equipment_items
CREATE POLICY "Anyone can view equipment items" 
ON public.equipment_items 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert equipment items" 
ON public.equipment_items 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can delete equipment items" 
ON public.equipment_items 
FOR DELETE 
USING (true);

-- Create indexes for better query performance
CREATE INDEX idx_equipment_items_dataset_id ON public.equipment_items(dataset_id);
CREATE INDEX idx_equipment_datasets_uploaded_at ON public.equipment_datasets(uploaded_at DESC);

-- Create function to clean up old datasets (keep only last 5)
CREATE OR REPLACE FUNCTION public.cleanup_old_datasets()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.equipment_datasets
  WHERE id NOT IN (
    SELECT id FROM public.equipment_datasets
    ORDER BY uploaded_at DESC
    LIMIT 5
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to auto-cleanup after insert
CREATE TRIGGER cleanup_datasets_trigger
AFTER INSERT ON public.equipment_datasets
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_old_datasets();