package nl.centric.innovation.local4localEU.unit;

import nl.centric.innovation.local4localEU.authentication.JwtUtil;
import nl.centric.innovation.local4localEU.entity.OtpResend;
import nl.centric.innovation.local4localEU.entity.OtpCodes;
import nl.centric.innovation.local4localEU.entity.User;
import nl.centric.innovation.local4localEU.exception.CustomException.AuthenticationLoginException;
import nl.centric.innovation.local4localEU.exception.CustomException.DtoValidateException;
import nl.centric.innovation.local4localEU.exception.CustomException.DtoValidateNotFoundException;
import nl.centric.innovation.local4localEU.repository.OtpResendRepository;
import nl.centric.innovation.local4localEU.service.impl.OtpResendService;
import nl.centric.innovation.local4localEU.service.interfaces.EmailService;
import nl.centric.innovation.local4localEU.service.interfaces.OtpCodesService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;


@ExtendWith(MockitoExtension.class)
class OtpResendServiceTests {

    @Mock
    private OtpResendRepository otpResendRepository;

    @Mock
    private OtpCodesService otpCodesService;

    @Mock
    private EmailService emailService;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private HttpServletRequest httpServletRequest;

    @InjectMocks
    private OtpResendService otpResendService;

    @BeforeEach
    void setup() {
        ReflectionTestUtils.setField(otpResendService, "errorSessionNotFound", "Session not found.");
        ReflectionTestUtils.setField(otpResendService, "errorResendMaxAchieved", "Maximum OTP resend attempts reached.");
        ReflectionTestUtils.setField(otpResendService, "otpExpirationTime", "60");
        ReflectionTestUtils.setField(otpResendService, "otpNotFound", "OTP not found.");
    }

    @Test
    void GivenInvalidSessionId_WhenResendOtp_ThenShouldThrowAuthenticationLoginException() {
        // Given
        when(jwtUtil.extractTokenFromCookie(httpServletRequest, "sessionId")).thenReturn("");

        // When & Then
         assertThrows(AuthenticationLoginException.class, () ->
                otpResendService.resendOtp("en", httpServletRequest)
        );

    }

    @Test
    void GivenValidSessionId_But_OtpCodeNotFound_WhenResendOtp_ThenShouldThrowDtoValidateNotFoundException() {
        // Given
        String sessionId = UUID.randomUUID().toString();
        when(jwtUtil.extractTokenFromCookie(httpServletRequest, "sessionId")).thenReturn(sessionId);
        when(otpCodesService.findBySessionId(UUID.fromString(sessionId))).thenReturn(Optional.empty());

        // When & Then
        assertThrows(DtoValidateNotFoundException.class, () ->
                otpResendService.resendOtp("en", httpServletRequest)
        );
    }

    @Test
    void GivenValidSessionId_But_MaxResendAttemptsReached_WhenResendOtp_ThenShouldThrowDtoValidateException() {
        // Given
        String sessionId = UUID.randomUUID().toString();
        OtpCodes otpCode = mock(OtpCodes.class);
        OtpResend otpResend = mock(OtpResend.class);

        when(jwtUtil.extractTokenFromCookie(httpServletRequest, "sessionId")).thenReturn(sessionId);
        when(otpCodesService.findBySessionId(UUID.fromString(sessionId))).thenReturn(Optional.of(otpCode));
        when(otpResendRepository.findTopBySessionIdOrderByCreatedDateDesc(UUID.fromString(sessionId)))
                .thenReturn(Optional.of(otpResend));
        when(otpResend.getCreatedDate()).thenReturn(LocalDateTime.now().minusMinutes(3));

        // When & Then
       assertThrows(DtoValidateException.class, () ->
                otpResendService.resendOtp("en", httpServletRequest)
        );
    }

    @Test
    void GivenValidSessionId_WhenResendOtp_ThenShouldResendOtpSuccessfully() throws DtoValidateException, AuthenticationLoginException {
        // Given
        String sessionId = UUID.randomUUID().toString();
        OtpCodes otpCode = mock(OtpCodes.class);
        OtpResend otpResend = mock(OtpResend.class);
        User user = mock(User.class);
        String userEmail = "test@example.com";
        OtpCodes newOtpCode = mock(OtpCodes.class);

        when(jwtUtil.extractTokenFromCookie(httpServletRequest, "sessionId")).thenReturn(sessionId);
        when(otpCodesService.findBySessionId(UUID.fromString(sessionId))).thenReturn(Optional.of(otpCode));
        when(otpResendRepository.findTopBySessionIdOrderByCreatedDateDesc(UUID.fromString(sessionId)))
                .thenReturn(Optional.of(otpResend));
        when(otpResend.getCreatedDate()).thenReturn(LocalDateTime.now().minusMinutes(10));
        when(otpCode.getUser()).thenReturn(user);
        when(user.getId()).thenReturn(UUID.randomUUID());
        when(user.getEmail()).thenReturn(userEmail);
        when(otpCodesService.createNewOtpWhenResendEmail(otpCode)).thenReturn(newOtpCode);
        when(newOtpCode.getOtpCode()).thenReturn(Integer.valueOf("123456"));

        // When
        HttpHeaders responseHeaders = otpResendService.resendOtp("en", httpServletRequest);

        // Then
        assertNotNull(responseHeaders);
        assertTrue(responseHeaders.containsKey(HttpHeaders.SET_COOKIE));
    }
}
