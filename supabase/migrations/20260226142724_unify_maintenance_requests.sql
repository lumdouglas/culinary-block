-- Move legacy maintenance requests to maintenance_tickets
INSERT INTO maintenance_tickets (id, user_id, title, description, priority, status, created_at, updated_at)
SELECT 
    id, 
    user_id, 
    'Maintenance Request (Legacy)', 
    description, 
    CASE 
        WHEN priority = 'low' THEN 'low'::text
        WHEN priority = 'medium' THEN 'medium'::text
        WHEN priority = 'high' THEN 'high'::text
        ELSE 'medium'::text
    END,
    CASE
        WHEN status = 'pending' THEN 'open'::text
        WHEN status = 'in_progress' THEN 'in_progress'::text
        WHEN status = 'resolved' OR status = 'approved' THEN 'resolved'::text
        WHEN status = 'rejected' THEN 'closed'::text
        ELSE 'open'::text
    END,
    created_at, 
    updated_at
FROM requests 
WHERE type = 'maintenance';

-- Delete migrated records from requests table
DELETE FROM requests WHERE type = 'maintenance';
