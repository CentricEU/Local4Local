package nl.centric.innovation.local4localEU.unit;

import jakarta.servlet.http.HttpServletRequest;
import lombok.SneakyThrows;
import nl.centric.innovation.local4localEU.dto.LoginRequestDto;
import nl.centric.innovation.local4localEU.dto.LoginResponseDto;
import nl.centric.innovation.local4localEU.entity.LoginAttempt;
import nl.centric.innovation.local4localEU.entity.OtpCodes;
import nl.centric.innovation.local4localEU.entity.Role;
import nl.centric.innovation.local4localEU.entity.User;
import nl.centric.innovation.local4localEU.exception.CustomException.AuthenticationLoginException;
import nl.centric.innovation.local4localEU.exception.CustomException.CaptchaException;
import nl.centric.innovation.local4localEU.exception.CustomException.DtoValidateNotFoundException;
import nl.centric.innovation.local4localEU.service.impl.AuthenticationServiceImpl;
import nl.centric.innovation.local4localEU.service.interfaces.CaptchaService;
import nl.centric.innovation.local4localEU.service.interfaces.LoginAttemptService;
import nl.centric.innovation.local4localEU.service.interfaces.OtpCodesService;
import nl.centric.innovation.local4localEU.authentication.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.security.authentication.AuthenticationManager;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.util.ReflectionTestUtils;
import util.SecurityUtils;

import java.util.Date;
import java.util.Optional;
import java.util.UUID;

import static org.junit.Assert.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class AuthenticationServiceImplTests {

    @InjectMocks
    private AuthenticationServiceImpl authenticationService;

    @Mock
    private UserDetailsService userDetailsService;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private LoginAttemptService loginAttemptService;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private CaptchaService captchaService;

    @Mock
    private HttpServletRequest request;

    @Mock
    private EmailService emailService;

    @Mock
    private OtpCodesService otpCodesService;

    private static final String INVALID_RESPONSE = "invalidResponse";
    private static final String PASSWORD = "password";
    private static final String EMAIL = "username@example.com";
    private static final String EMPTY_STRING = "";
    private static final String REMOTE_ADDRESS = "0.0.0.1";
    private static final String LANGUAGE = "en";

    @BeforeEach
    void setup() {
        ReflectionTestUtils.setField(authenticationService, "otpExpirationTime", "900");

    }

    @Test
    @SneakyThrows
    void GivenValidRequest_WhenAuthenticateByRole_ThenExpectSuccessAndSessionIdCookie() {
        // Given
        LoginRequestDto loginRequestDto = loginRequestDtoBuilder(EMPTY_STRING, true);
        Role role = Role.builder().name(Role.ROLE_MANAGER).id(0).build();
        User mockUser = User.builder().email(EMAIL).role(role).build();
        UUID sessionId = UUID.randomUUID();
        OtpCodes otpCode = OtpCodes.builder()
                .user(mockUser)
                .sessionId(sessionId)
                .otpCode(123456)
                .build();

        when(userDetailsService.loadUserByUsername(loginRequestDto.email()))
                .thenReturn(mockUser);
        when(otpCodesService.checkForOtpCode(mockUser, null)).thenReturn(otpCode);
        doNothing().when(emailService).sendManagerOtpEmail(LANGUAGE, new String[]{mockUser.getEmail()}, otpCode.getOtpCode());

        // When
        HttpHeaders result = authenticationService.authenticateByRole(loginRequestDto, LANGUAGE, request);

        // Then
        assertNotNull(result.get(HttpHeaders.SET_COOKIE));

        boolean hasSessionIdCookie = result.get(HttpHeaders.SET_COOKIE).stream()
                .anyMatch(cookie -> cookie.contains("sessionId"));
        boolean hasRememberMeCookie = result.get(HttpHeaders.SET_COOKIE).stream()
                .anyMatch(cookie -> cookie.contains("rememberMe"));

        Assertions.assertTrue(hasSessionIdCookie);
        Assertions.assertTrue(hasRememberMeCookie);
    }

    @Test
    @SneakyThrows
    void GivenValidRequestWithoutSessionId_WhenAuthenticateByRole_ThenExpectNewSessionId() {
        // Given
        LoginRequestDto loginRequestDto = loginRequestDtoBuilder(EMPTY_STRING, false);
        Role role = Role.builder().name(Role.ROLE_MANAGER).id(0).build();
        User mockUser = User.builder().email(EMAIL).role(role).build();
        UUID newSessionId = UUID.randomUUID();
        OtpCodes otpCode = OtpCodes.builder()
                .user(mockUser)
                .sessionId(newSessionId)
                .otpCode(123456)
                .build();

        when(userDetailsService.loadUserByUsername(loginRequestDto.email()))
                .thenReturn(mockUser);
        when(otpCodesService.checkForOtpCode(mockUser, null)).thenReturn(otpCode); // Simulate no session ID
        doNothing().when(emailService).sendManagerOtpEmail(LANGUAGE, new String[]{mockUser.getEmail()}, otpCode.getOtpCode());

        // When
        HttpHeaders result = authenticationService.authenticateByRole(loginRequestDto, LANGUAGE, request);

        // Then
        assertNotNull(result.get(HttpHeaders.SET_COOKIE));

        boolean hasSessionIdCookie = result.get(HttpHeaders.SET_COOKIE).stream()
                .anyMatch(cookie -> cookie.contains("sessionId"));

        Assertions.assertTrue(hasSessionIdCookie);
    }

    @Test
    @SneakyThrows
    void GivenValidRequestWithExistingSessionId_WhenAuthenticateByRole_ThenReuseSessionId() {
        // Given
        LoginRequestDto loginRequestDto = loginRequestDtoBuilder(EMPTY_STRING, true);
        Role role = Role.builder().name(Role.ROLE_MANAGER).id(0).build();
        User mockUser = User.builder().email(EMAIL).role(role).build();
        UUID existingSessionId = UUID.randomUUID();
        OtpCodes otpCode = OtpCodes.builder()
                .user(mockUser)
                .sessionId(existingSessionId)
                .otpCode(123456)
                .build();

        when(jwtUtil.extractTokenFromCookie(request, "jwtToken")).thenReturn(null);
        when(jwtUtil.extractTokenFromCookie(request, "sessionId")).thenReturn(existingSessionId.toString());

        when(userDetailsService.loadUserByUsername(loginRequestDto.email()))
                .thenReturn(mockUser);
        when(otpCodesService.checkForOtpCode(mockUser, existingSessionId.toString())).thenReturn(otpCode); // Existing session ID
        doNothing().when(emailService).sendManagerOtpEmail(LANGUAGE, new String[]{mockUser.getEmail()}, otpCode.getOtpCode());

        // When
        HttpHeaders result = authenticationService.authenticateByRole(loginRequestDto, LANGUAGE, request);

        // Then
        assertNotNull(result.get(HttpHeaders.SET_COOKIE));

        boolean hasSessionIdCookie = result.get(HttpHeaders.SET_COOKIE).stream()
                .anyMatch(cookie -> cookie.contains("sessionId"));

        Assertions.assertTrue(hasSessionIdCookie);
    }

    @Test
    void GivenInvalidCaptcha_WhenAuthenticateByRole_ThenThrowCaptchaException() {
        // Given
        LoginRequestDto loginRequestDto = loginRequestDtoBuilder(INVALID_RESPONSE, false);

        when(captchaService.isResponseValid(any(), any())).thenReturn(false);

        // When / Then
        assertThrows(CaptchaException.class, () ->
                authenticationService.authenticateByRole(loginRequestDto, LANGUAGE, request)
        );
    }

    @Test
    void GivenTooManyAttempts_WhenAuthenticateByRole_ThenThrowCaptchaException() {
        // Given
        LoginRequestDto loginRequestDto = loginRequestDtoBuilder(EMPTY_STRING, false);
        LoginAttempt loginAttempt = LoginAttempt.builder().remoteAddress(REMOTE_ADDRESS).count(5).build();

        when(SecurityUtils.getClientIP(request)).thenReturn(REMOTE_ADDRESS);
        when(loginAttemptService.findByRemoteAddress(REMOTE_ADDRESS)).thenReturn(Optional.of(loginAttempt));
        when(loginAttemptService.isBlocked(loginAttempt)).thenReturn(true);

        // When / Then
        assertThrows(CaptchaException.class, () ->
                authenticationService.authenticateByRole(loginRequestDto, LANGUAGE, request)
        );
    }

    @Test
    @SneakyThrows
    void GivenValidToken_WhenGetTokenInfo_ThenExpectCorrectResponse() {
        // Given
        String token = "mocked-token";
        String expectedRole = Role.ROLE_MANAGER;
        Date expectedExpirationDate = new Date();

        when(jwtUtil.extractTokenFromCookie(request, "jwtToken")).thenReturn(token);
        when(jwtUtil.extractRole(token)).thenReturn(expectedRole);
        when(jwtUtil.extractExpirationDate(token)).thenReturn(expectedExpirationDate);

        // When
        LoginResponseDto result = authenticationService.getTokenInfo(request);

        // Then
        assertNotNull(result);
        assertEquals(expectedRole, result.role());
        assertEquals(expectedExpirationDate, result.expirationDate());
    }

    @Test
    void GivenNoToken_WhenGetTokenInfo_ThenExpectDtoValidateNotFoundException() {
        // Given
        when(jwtUtil.extractTokenFromCookie(request, "jwtToken")).thenReturn(null);

        // When and Then
        assertThrows(DtoValidateNotFoundException.class, () -> authenticationService.getTokenInfo(request));
    }

    @Test
    void GivenBadCredentials_WhenManageBadCredentials_ThenThrowAuthenticationLoginException() {
        // Given
        LoginRequestDto loginRequestDto = loginRequestDtoBuilder(INVALID_RESPONSE, false);
        String remoteAddress = REMOTE_ADDRESS;

        Role role = Role.builder().name(Role.ROLE_MANAGER).id(0).build();
        User mockUser = User.builder().email(EMAIL).role(role).build();

        LoginAttempt loginAttempt = LoginAttempt.builder()
                .remoteAddress(remoteAddress)
                .count(1)
                .build();

        when(loginAttemptService.countLoginAttempts(any(), any(), anyBoolean())).thenReturn(loginAttempt);
        when(loginAttemptService.isBlocked(loginAttempt)).thenReturn(false);
        when(captchaService.isResponseValid(any(), any())).thenReturn(true);

        when(authenticationManager.authenticate(any())).thenThrow(new BadCredentialsException("Bad credentials"));

        // When / Then
        assertThrows(AuthenticationLoginException.class, () ->
                authenticationService.authenticateByRole(loginRequestDto, LANGUAGE, request)
        );
    }

    @Test
    void GivenTooManyBadCredentials_WhenManageBadCredentials_ThenThrowCaptchaException() {
        // Given
        LoginRequestDto loginRequestDto = loginRequestDtoBuilder(EMPTY_STRING, false);
        String remoteAddress = REMOTE_ADDRESS;

        LoginAttempt loginAttempt = LoginAttempt.builder()
                .remoteAddress(remoteAddress)
                .count(5)
                .build();

        when(SecurityUtils.getClientIP(request)).thenReturn(remoteAddress);

        when(loginAttemptService.countLoginAttempts(any(), any(), anyBoolean())).thenReturn(loginAttempt);
        when(loginAttemptService.isBlocked(loginAttempt)).thenReturn(true);  // Simulate account is blocked
        when(authenticationManager.authenticate(any())).thenThrow(new BadCredentialsException("Bad credentials"));

        // When / Then
        assertThrows(CaptchaException.class, () -> {
            authenticationService.authenticateByRole(loginRequestDto, LANGUAGE, request);
        });
        verify(userDetailsService, times(0)).loadUserByUsername(any());
    }



    private LoginRequestDto loginRequestDtoBuilder(String reCaptchaResponse, Boolean rememberMe) {
        return LoginRequestDto.builder()
                .password(PASSWORD)
                .email(EMAIL)
                .role(Role.ROLE_MANAGER)
                .reCaptchaResponse(reCaptchaResponse)
                .rememberMe(rememberMe)
                .build();
    }
}
