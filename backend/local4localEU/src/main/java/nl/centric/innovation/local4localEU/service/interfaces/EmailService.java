package nl.centric.innovation.local4localEU.service.interfaces;

import java.util.Map;
import java.util.UUID;

public interface EmailService {
    void sendInviteMerchantEmail(String language, Map<String, UUID> toAddress, String message);

    void sendPasswordRecoveryEmail(String url, String[] toAddress, String language);

    void sendMerchantRegisteredEmail(String url, String language, String merchantName, String[] managerEmails);

    void sendManagerOtpEmail(String language, String[] managerEmail, Integer otpCode);

    void sendApproveMerchantEmail(String[] contactEmail, String language, String companyName, UUID token, String merchantName);

    void sendRejectMerchantEmail(String[] toAddress, String language, String companyName, String reason);
}
