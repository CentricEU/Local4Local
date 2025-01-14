-- 1. Drop the existing unique constraint
ALTER TABLE l4l_eu_security.merchant
DROP CONSTRAINT unique_identifier_number;

-- 2. Add the new unique constraint depending on the status
CREATE UNIQUE INDEX unique_identifier_number_not_rejected
ON l4l_eu_security.merchant (identifier_number)
WHERE status != 'REJECTED';