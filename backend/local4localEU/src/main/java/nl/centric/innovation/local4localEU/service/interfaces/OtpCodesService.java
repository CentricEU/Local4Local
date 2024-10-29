package nl.centric.innovation.local4localEU.service.interfaces;

import jakarta.servlet.http.HttpServletRequest;
import nl.centric.innovation.local4localEU.dto.AuthResponseDto;
import nl.centric.innovation.local4localEU.entity.OtpCodes;
import nl.centric.innovation.local4localEU.entity.User;
import nl.centric.innovation.local4localEU.exception.CustomException.AuthenticationLoginException;

import java.util.Optional;
import java.util.UUID;

public interface OtpCodesService {
    OtpCodes checkForOtpCode(User user, String sessionId);

    Optional<OtpCodes> findBySessionId(UUID sessionId);

    OtpCodes createNewOtpWhenResendEmail(OtpCodes otpCode);

    AuthResponseDto validateOtp(HttpServletRequest request, Integer otpCode) throws AuthenticationLoginException;
}
