ALTER TABLE l4l_eu_security.user ADD COLUMN is_locked BOOLEAN DEFAULT FALSE NOT NULL;

ALTER TABLE l4l_eu_security.otp_attempts
RENAME TO otp_resend;
