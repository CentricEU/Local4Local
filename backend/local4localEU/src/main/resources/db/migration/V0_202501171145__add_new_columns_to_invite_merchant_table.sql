-- Step 1:
-- Delete old entries from merchant_invitation table.

DELETE FROM l4l_eu_global.merchant_invitation;

-- Step 2:
-- Add new columns to merchant_invitation table: is_registered, token, token_expiration_date.
-- is_registered: to check if the invited merchant has registered or not.
-- token: to generate a unique token for the invited merchant.
-- token_expiration_date: to set the expiration date for the token.

ALTER TABLE l4l_eu_global.merchant_invitation
ADD COLUMN is_registered boolean DEFAULT FALSE NOT NULL,
ADD COLUMN token uuid DEFAULT uuid_generate_v1() NOT NULL,
ADD COLUMN token_expiration_date timestamp without time zone DEFAULT (NOW() + INTERVAL '2 days') NOT NULL;
