-- =====================================================
-- Fix kitchens table schema
-- =====================================================
-- Add missing columns that weren't created because table existed

-- Add description column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'kitchens' AND column_name = 'description'
  ) THEN
    ALTER TABLE kitchens ADD COLUMN description TEXT;
  END IF;
END $$;

-- Add is_active column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'kitchens' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE kitchens ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Add created_at column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'kitchens' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE kitchens ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Add kitchen_id column to timesheets if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'timesheets' AND column_name = 'kitchen_id'
  ) THEN
    ALTER TABLE timesheets ADD COLUMN kitchen_id UUID REFERENCES kitchens(id);
  END IF;
END $$;

-- Add notes column to timesheets if it doesn't exist  
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'timesheets' AND column_name = 'notes'
  ) THEN
    ALTER TABLE timesheets ADD COLUMN notes TEXT;
  END IF;
END $$;
