select otp_code from l4l_eu_security.otp_codes where user_id = (select id from l4l_eu_security.user where email = $1) ORDER BY created_date DESC
    LIMIT 1;