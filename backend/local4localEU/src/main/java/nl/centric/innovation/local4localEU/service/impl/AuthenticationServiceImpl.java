package nl.centric.innovation.local4localEU.service.impl;

import io.hypersistence.utils.common.StringUtils;
import io.jsonwebtoken.ExpiredJwtException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import nl.centric.innovation.local4localEU.dto.LoginRequestDto;
import nl.centric.innovation.local4localEU.dto.LoginResponseDto;
import nl.centric.innovation.local4localEU.entity.LoginAttempt;
import nl.centric.innovation.local4localEU.entity.OtpCodes;
import nl.centric.innovation.local4localEU.entity.User;
import nl.centric.innovation.local4localEU.exception.CustomException.AuthenticationLoginException;
import nl.centric.innovation.local4localEU.exception.CustomException.CaptchaException;
import nl.centric.innovation.local4localEU.exception.CustomException.DtoValidateNotFoundException;
import nl.centric.innovation.local4localEU.exception.CustomException.InvalidRoleException;
import nl.centric.innovation.local4localEU.service.interfaces.AuthenticationService;
import nl.centric.innovation.local4localEU.service.interfaces.CaptchaService;
import nl.centric.innovation.local4localEU.service.interfaces.LoginAttemptService;
import nl.centric.innovation.local4localEU.service.interfaces.OtpCodesService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.PropertySource;
import org.springframework.http.HttpCookie;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Service;
import nl.centric.innovation.local4localEU.authentication.JwtUtil;
import util.SecurityUtils;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@PropertySource({"classpath:errorcodes.properties"})
public class AuthenticationServiceImpl implements AuthenticationService {

    private final UserDetailsService userDetailsService;

    private final JwtUtil jwtUtil;

    private final AuthenticationManager authenticationManager;

    private final LoginAttemptService loginAttemptService;

    private final CaptchaService captchaService;

    private final EmailService emailService;

    private final OtpCodesService otpCodesService;

    @Value("${error.captcha.show}")
    private String errorCaptchaShow;
    @Value("${error.captcha.notCompleted}")
    private String errorCaptchaNotCompleted;

    @Value("${error.credentials.invalid}")
    private String errorCredentialsInvalid;

    @Value("${otp.expiration.time}")
    private String otpExpirationTime;

    @Value("${error.jwt.notFound}")
    private String errorJwtNotFound;

    @Value("${error.existing.session}")
    private String errorExistingSession;

    @Override
    public HttpHeaders authenticateByRole(LoginRequestDto loginRequest, String language, HttpServletRequest request)
            throws CaptchaException, AuthenticationLoginException, InvalidRoleException {

        String accessToken = jwtUtil.extractTokenFromCookie(request, "jwtToken");

        if (accessToken != null) {
            throw new AuthenticationLoginException(errorExistingSession);
        }

        String remoteAddress = SecurityUtils.getClientIP(request);

        boolean isRecaptchaBlank = StringUtils.isBlank(loginRequest.reCaptchaResponse());

        Optional<LoginAttempt> loginAttempt = loginAttemptService.findByRemoteAddress(remoteAddress);

        if (shouldShowCaptcha(loginAttempt, isRecaptchaBlank)) {
            loginAttemptService.countLoginAttempts(loginAttempt, remoteAddress, false);
            throw new CaptchaException(errorCaptchaShow);
        }

        if (isCaptchaValid(isRecaptchaBlank, loginRequest.reCaptchaResponse(), remoteAddress)) {
            return performAuthentication(loginRequest, remoteAddress, loginAttempt, language, request);
        }

        throw new CaptchaException(errorCaptchaNotCompleted);
    }

    @Override
    public LoginResponseDto getTokenInfo(HttpServletRequest httpServletRequest) throws DtoValidateNotFoundException,
            ExpiredJwtException {
        String token = jwtUtil.extractTokenFromCookie(httpServletRequest, "jwtToken");

        if (token == null) {
            throw new DtoValidateNotFoundException(errorJwtNotFound);
        }

        String rememberMeToken = jwtUtil.extractTokenFromCookie(httpServletRequest, "refreshToken");
        boolean isRememberMeActive = (rememberMeToken != null);

        jwtUtil.validateToken(token);
        return new LoginResponseDto(jwtUtil.extractRole(token), jwtUtil.extractExpirationDate(token), isRememberMeActive);

    }

    private HttpHeaders performAuthentication(LoginRequestDto loginRequestDto, String remoteAddress,
                                              Optional<LoginAttempt> loginAttempt, String language,
                                              HttpServletRequest httpServletRequest)
            throws CaptchaException, AuthenticationLoginException, InvalidRoleException {

        authenticate(loginAttempt, loginRequestDto, remoteAddress);
        User userDetails = loadUserDetails(loginRequestDto.email());
        validateUserRole(userDetails, loginRequestDto.role());

        loginAttemptService.countLoginAttempts(loginAttempt, remoteAddress, true);

        HttpHeaders httpHeaders = new HttpHeaders();

        String sessionId = jwtUtil.extractTokenFromCookie(httpServletRequest, "sessionId");
        OtpCodes otpCode = otpCodesService.checkForOtpCode(userDetails, sessionId);

        boolean verifySessionId = sessionId == null || sessionId.isEmpty() ||
                otpCode.getSessionId() != UUID.fromString(sessionId);

        if (verifySessionId) {
            setCookies(httpHeaders, otpCode.getSessionId(), loginRequestDto.rememberMe());
        }

        emailService.sendManagerOtpEmail(language, new String[]{userDetails.getEmail()}, otpCode.getOtpCode());

        return httpHeaders;
    }

    private HttpCookie createSessionIdCookie(UUID sessionId) {
        return SecurityUtils.createCookie("sessionId", sessionId.toString(), otpExpirationTime);
    }

    private HttpCookie createRememberMeCookie(Boolean rememberMe) {
        return SecurityUtils.createCookie("rememberMe", rememberMe.toString(), otpExpirationTime);
    }

    private void setCookies(HttpHeaders httpHeaders, UUID sessionId, Boolean rememberMe) {
        httpHeaders.add(HttpHeaders.SET_COOKIE, createSessionIdCookie(sessionId).toString());
        httpHeaders.add(HttpHeaders.SET_COOKIE, createRememberMeCookie(rememberMe).toString());
    }

    private User loadUserDetails(String email) throws AuthenticationLoginException {
        return (User) userDetailsService.loadUserByUsername(email);
    }

    private void validateUserRole(User userDetails, String expectedRole) throws InvalidRoleException {
        boolean isRoleValid = userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(expectedRole));

        if (!isRoleValid) {
            throw new InvalidRoleException("Unexpected role");
        }
    }


    private void authenticate(Optional<LoginAttempt> loginAttempt, LoginRequestDto loginRequestDto,
                              String remoteAddress) throws CaptchaException, AuthenticationLoginException {
        var username = loginRequestDto.email();
        var password = loginRequestDto.password();

        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(username, password));
        } catch (DisabledException e) {
            throw new AuthenticationLoginException("USER_DISABLED");
        } catch (BadCredentialsException e) {
            this.manageBadCredentials(loginRequestDto, remoteAddress, loginAttempt);
        }
    }

    private void manageBadCredentials(LoginRequestDto loginRequestDto, String
            remoteAddress, Optional<LoginAttempt> loginAttempt) throws CaptchaException, AuthenticationLoginException {
        LoginAttempt loginAttemptResult = loginAttemptService.countLoginAttempts(loginAttempt, remoteAddress, false);

        if (loginAttemptService.isBlocked(loginAttemptResult)) {
            if (loginRequestDto.reCaptchaResponse() == null || loginRequestDto.reCaptchaResponse().isEmpty()) {
                throw new CaptchaException(errorCaptchaShow);
            }
            throw new CaptchaException(errorCredentialsInvalid);
        }

        throw new AuthenticationLoginException(errorCredentialsInvalid);
    }

    private boolean shouldShowCaptcha(Optional<LoginAttempt> loginAttempt, boolean isRecaptchaBlank) {
        return loginAttempt.isPresent() && loginAttemptService.isBlocked(loginAttempt.get()) && isRecaptchaBlank;
    }

    private boolean isCaptchaValid(boolean isRecaptchaBlank, String reCaptchaResponse, String remoteAddress) {
        return isRecaptchaBlank || captchaService.isResponseValid(reCaptchaResponse, remoteAddress);
    }

}
