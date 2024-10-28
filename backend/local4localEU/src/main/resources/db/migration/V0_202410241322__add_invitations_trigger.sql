CREATE OR REPLACE FUNCTION update_invite_merchants()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE l4l_eu_global.merchant_invitation invites
    SET is_active = false
    WHERE ((NEW.email = invites.email ) AND (NEW.id != invites.id ));
	NEW.is_active = true;
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_update_invite_merchants
BEFORE INSERT ON l4l_eu_global.merchant_invitation
FOR EACH ROW
EXECUTE FUNCTION update_invite_merchants();