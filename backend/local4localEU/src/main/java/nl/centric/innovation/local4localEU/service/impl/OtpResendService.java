package nl.centric.innovation.local4localEU.service.impl;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import nl.centric.innovation.local4localEU.authentication.JwtUtil;
import nl.centric.innovation.local4localEU.entity.OtpResend;
import nl.centric.innovation.local4localEU.entity.OtpCodes;
import nl.centric.innovation.local4localEU.entity.User;
import nl.centric.innovation.local4localEU.exception.CustomException.AuthenticationLoginException;
import nl.centric.innovation.local4localEU.exception.CustomException.DtoValidateException;
import nl.centric.innovation.local4localEU.exception.CustomException.DtoValidateNotFoundException;
import nl.centric.innovation.local4localEU.repository.OtpResendRepository;
import nl.centric.innovation.local4localEU.service.interfaces.OtpCodesService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpCookie;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import util.SecurityUtils;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class OtpResendService {

    private final OtpResendRepository otpResendRepository;

    private final OtpCodesService otpCodesService;

    private final EmailService emailService;

    private final JwtUtil jwtUtil;

    @Value("${error.session.notFound}")
    private String errorSessionNotFound;

    @Value("${error.resend.maxAchieved}")
    private String errorResendMaxAchieved;

    @Value("${otp.expiration.time}")
    private String otpExpirationTime;

    @Value("${error.otp.notFound}")
    private String otpNotFound;

    @Transactional
    public HttpHeaders resendOtp(String language, HttpServletRequest httpServletRequest)
            throws DtoValidateException, AuthenticationLoginException {
        Optional<OtpCodes> otpCode =  validateSession(httpServletRequest);

        Optional<OtpResend> otpResend = otpResendRepository.findTopBySessionIdOrderByCreatedDateDesc(otpCode.get().getSessionId());

        validateResend(otpResend);

        User userDetails = otpCode.get().getUser();
        OtpResend newAttempt = OtpResend.of(otpCode.get().getSessionId(), userDetails.getId());
        otpResendRepository.save(newAttempt);

        OtpCodes newOtpCode = otpCodesService.createNewOtpWhenResendEmail(otpCode.get());
        emailService.sendManagerOtpEmail(language, new String[]{userDetails.getEmail()}, newOtpCode.getOtpCode());
        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.add(HttpHeaders.SET_COOKIE, createSessionIdCookie(otpCode.get().getSessionId()).toString());

        return httpHeaders;
    }

    private Optional<OtpCodes> validateSession(HttpServletRequest httpServletRequest)
            throws AuthenticationLoginException, DtoValidateNotFoundException {
        String sessionIdFromCookie = jwtUtil.extractTokenFromCookie(httpServletRequest, "sessionId");

        if (sessionIdFromCookie == null) {
            throw new AuthenticationLoginException(otpNotFound);
        }

        UUID sessionId = UUID.fromString(sessionIdFromCookie);
        Optional<OtpCodes> otpCode = otpCodesService.findBySessionId(sessionId);

        if (otpCode.isEmpty()) {
            throw new DtoValidateNotFoundException(errorSessionNotFound);
        }

        return otpCode;
    }

    private void validateResend(Optional<OtpResend> otpResend) throws DtoValidateException {
        if (otpResend.isPresent()) {
            LocalDateTime isResendAvailable = otpResend.get().getCreatedDate()
                    .plusMinutes(5);
            if (LocalDateTime.now().isBefore(isResendAvailable)) {
                throw new DtoValidateException(errorResendMaxAchieved);
            }
        }
    }

    private HttpCookie createSessionIdCookie(UUID sessionId) {
        return SecurityUtils.createCookie("sessionId", sessionId.toString(), otpExpirationTime);
    }

}
