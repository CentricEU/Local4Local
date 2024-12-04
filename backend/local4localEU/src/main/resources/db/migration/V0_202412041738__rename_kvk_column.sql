-- 1. Drop the existing unique constraint
ALTER TABLE l4l_eu_security.merchant
DROP CONSTRAINT unique_kvk;

-- 2. Rename the column 'kvk' to 'identifier_number'
ALTER TABLE l4l_eu_security.merchant
RENAME COLUMN kvk TO identifier_number;

-- 3. Change the data type to 'character varying(20)'
ALTER TABLE l4l_eu_security.merchant
ALTER COLUMN identifier_number TYPE character varying(20);

-- 4. Add the unique constraint on the new column
ALTER TABLE l4l_eu_security.merchant
ADD CONSTRAINT unique_identifier_number UNIQUE (identifier_number);
