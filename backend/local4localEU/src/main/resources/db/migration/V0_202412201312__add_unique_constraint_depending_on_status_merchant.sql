-- 1. Drop the existing unique constraint
ALTER TABLE l4l_eu_security.merchant
DROP CONSTRAINT constraint_name;

-- 2. Add the new unique constraint depending on the status

CREATE UNIQUE INDEX unique_email_status
ON l4l_eu_security.merchant (contact_email)
WHERE status IN ('APPROVED', 'PENDING');