package nl.centric.innovation.local4localEU.service.impl;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import nl.centric.innovation.local4localEU.authentication.JwtUtil;
import nl.centric.innovation.local4localEU.dto.AuthResponseDto;
import nl.centric.innovation.local4localEU.dto.LoginResponseDto;
import nl.centric.innovation.local4localEU.entity.OtpCodes;
import nl.centric.innovation.local4localEU.entity.Role;
import nl.centric.innovation.local4localEU.entity.User;
import nl.centric.innovation.local4localEU.exception.CustomException.AuthenticationLoginException;
import nl.centric.innovation.local4localEU.repository.OtpCodesRepository;
import nl.centric.innovation.local4localEU.service.interfaces.OtpCodesService;
import nl.centric.innovation.local4localEU.service.interfaces.RefreshTokenService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpCookie;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import util.SecurityUtils;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static util.ClaimsUtils.setClaims;
import static util.SecurityUtils.deleteCookie;

@Service
@RequiredArgsConstructor
public class OtpCodesServiceImpl implements OtpCodesService {

    private final OtpCodesRepository otpCodesRepository;

    private final RefreshTokenService refreshTokenService;

    private final JwtUtil jwtUtil;
    @Value("${jwt.refresh.expiration}")
    private String refreshTokenDuration;

    @Value("${jwt.expiration.time}")
    private String jwtExpirationTime;

    @Value("${error.otp.notFound}")
    private String otpNotFound;

    @Value("${error.otp.notValid}")
    private String otpNotValid;

    @Value("${otp.expiration.time}")
    private String otpExpirationTime;

    /**
     * Checks for an existing OTP code for a given user. If a valid OTP is found, it is returned;
     * otherwise, a new OTP code is generated.
     * If a session ID is provided and a valid OTP exists (within the 15-minute expiration window),
     * the existing OTP will be returned. If no valid OTP is found a new OTP code with a new session is generated
     * for the user.
     * This is developed for the case when a user logs in, goes back to log in after the MFA page and logs in again.
     * We should send him the same OTP if it is still available, if not we should send a new one.
     */
    @Override
    @Transactional
    public OtpCodes checkForOtpCode(User user, String sessionId) {
        otpCodesRepository.deleteAllByCreatedDateBefore(LocalDateTime.now().minusMinutes(Integer.parseInt(otpExpirationTime) / 60));

        if (sessionId != null) {
            Optional<OtpCodes> otpCode = otpCodesRepository.findBySessionId(UUID.fromString(sessionId));
            if (otpCode.isPresent()) {
                LocalDateTime expiryTime = otpCode.get().getCreatedDate()
                        .plusMinutes(Integer.parseInt(otpExpirationTime) / 60);

                if (LocalDateTime.now().isAfter(expiryTime)) {
                    otpCodesRepository.delete(otpCode.get());
                    return createNewOtpCode(user, UUID.randomUUID());
                }

                return otpCode.get();
            }
        }

        return createNewOtpCode(user, UUID.randomUUID());
    }

    @Override
    public Optional<OtpCodes> findBySessionId(UUID sessionId) {
        return otpCodesRepository.findBySessionId(sessionId);
    }

    @Override
    public OtpCodes createNewOtpWhenResendEmail(OtpCodes otpCode) {
        otpCodesRepository.delete(otpCode);
        return createNewOtpCode(otpCode.getUser(), otpCode.getSessionId());
    }

    @Override
    @Transactional
    public AuthResponseDto validateOtp(HttpServletRequest request, Integer otpCode)
            throws AuthenticationLoginException {

        otpCodesRepository.deleteAllByCreatedDateBefore(LocalDateTime.now().minusMinutes(Integer.parseInt(otpExpirationTime) / 60));

        String sessionIdFromCookie = jwtUtil.extractTokenFromCookie(request, "sessionId");

        if (sessionIdFromCookie == null || sessionIdFromCookie.isEmpty()) {
            throw new AuthenticationLoginException(otpNotFound);
        }

        Boolean rememberMe = Boolean.parseBoolean(jwtUtil.extractTokenFromCookie(request, "rememberMe"));
        UUID sessionId = UUID.fromString(sessionIdFromCookie);

        if (!hasSixDigits(otpCode)) {
            throw new AuthenticationLoginException(otpNotValid);
        }

        Optional<OtpCodes> optionalOtpCode = otpCodesRepository.findBySessionIdAndOtpCode(sessionId, otpCode);

        if (optionalOtpCode.isPresent()) {
            OtpCodes otpCodeEntry = optionalOtpCode.get();

            LocalDateTime expiryTime = otpCodeEntry.getCreatedDate()
                    .plusMinutes(Integer.parseInt(otpExpirationTime) / 60);

            otpCodesRepository.delete(otpCodeEntry);
            if (LocalDateTime.now().isAfter(expiryTime)) {
                throw new AuthenticationLoginException(otpNotFound);
            }

            return generateAuthenticationResponse(otpCodeEntry.getUser(), rememberMe);
        }

        throw new AuthenticationLoginException(otpNotFound);
    }

    private OtpCodes createNewOtpCode(User user, UUID sessiodId) {
        OtpCodes otpCode = OtpCodes.builder()
                .otpCode(otpCodeGenerator())
                .sessionId(sessiodId)
                .user(user)
                .build();
        otpCodesRepository.save(otpCode);

        return otpCode;
    }


    private AuthResponseDto generateAuthenticationResponse(User userDetails, boolean rememberMe) {
        HttpHeaders httpHeaders = new HttpHeaders();

        // Modify extraClaims when necessary
        Map<String, Object> extraClaims = setClaims(userDetails);

        String jwtToken = jwtUtil.generateToken(extraClaims, userDetails);

        if (rememberMe) {
            String refreshToken = refreshTokenService.getRefreshToken(userDetails).getToken();
            httpHeaders.add(HttpHeaders.SET_COOKIE, createRefreshTokenCookie(refreshToken).toString());
            httpHeaders.add(HttpHeaders.SET_COOKIE, createJwtTokenCookie(jwtToken, true).toString());
        } else {
            httpHeaders.add(HttpHeaders.SET_COOKIE, createJwtTokenCookie(jwtToken, false).toString());
        }

        Role role = (Role) extraClaims.get("role");
        Date expirationDate = jwtUtil.extractExpirationDate(jwtToken);
        cleanLoginCookies(httpHeaders);

        return AuthResponseDto.builder()
                .loginResponseDto(LoginResponseDto.builder()
                        .role(role.getName())
                        .expirationDate(expirationDate)
                        .rememberMe(rememberMe)
                        .build())
                .httpHeaders(httpHeaders)
                .build();
    }

    private HttpCookie createJwtTokenCookie(String jwtToken, boolean rememberMe) {
        if (rememberMe) {
            return SecurityUtils.createCookie("jwtToken", jwtToken, refreshTokenDuration);
        }
        return SecurityUtils.createCookie("jwtToken", jwtToken, jwtExpirationTime);
    }

    private boolean hasSixDigits(Integer otpCode) {
        return otpCode >= 100000 && otpCode <= 999999;
    }

    private void cleanLoginCookies(HttpHeaders httpHeaders) {
        ResponseCookie sessionIdCookie = deleteCookie("sessionId");
        ResponseCookie rememberMeCookie = deleteCookie("rememberMe");

        httpHeaders.add(HttpHeaders.SET_COOKIE, sessionIdCookie.toString());
        httpHeaders.add(HttpHeaders.SET_COOKIE, rememberMeCookie.toString());

    }

    private HttpCookie createRefreshTokenCookie(String refreshToken) {
        return SecurityUtils.createCookie("refreshToken", refreshToken, refreshTokenDuration);
    }

    private int otpCodeGenerator() {
        SecureRandom random = new SecureRandom();
        return 100000 + random.nextInt(900000);
    }

}
