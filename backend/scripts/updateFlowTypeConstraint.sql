-- Migration: Update flow_type constraint to allow inflow/outflow
-- Date: 2025-11-23
-- Purpose: Fix check constraint blocking inflow/outflow values

-- Step 1: Drop the old constraint FIRST
ALTER TABLE whale_events
DROP CONSTRAINT IF EXISTS valid_flow_type;

-- Step 2: Update existing data (while there's no constraint)
UPDATE whale_events SET flow_type = 'inflow' WHERE flow_type = 'buy';
UPDATE whale_events SET flow_type = 'outflow' WHERE flow_type = 'sell';

-- Step 3: Add new constraint with inflow/outflow (after data is updated)
ALTER TABLE whale_events
ADD CONSTRAINT valid_flow_type
CHECK (flow_type IN ('inflow', 'outflow', 'exchange', 'internal', 'defi'));

-- Step 4: Verify migration
SELECT flow_type, COUNT(*) as count
FROM whale_events
GROUP BY flow_type
ORDER BY count DESC;
