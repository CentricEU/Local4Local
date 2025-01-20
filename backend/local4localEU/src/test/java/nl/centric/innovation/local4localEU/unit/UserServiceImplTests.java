package nl.centric.innovation.local4localEU.unit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Stream;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import nl.centric.innovation.local4localEU.dto.RecoverPasswordDto;
import nl.centric.innovation.local4localEU.entity.RecoverPassword;
import nl.centric.innovation.local4localEU.entity.User;
import nl.centric.innovation.local4localEU.exception.CustomException.CaptchaException;
import nl.centric.innovation.local4localEU.exception.CustomException.DtoValidateException;
import nl.centric.innovation.local4localEU.exception.CustomException.DtoValidateNotFoundException;
import nl.centric.innovation.local4localEU.exception.CustomException.PasswordSameException;
import nl.centric.innovation.local4localEU.exception.CustomException.RecoverException;
import nl.centric.innovation.local4localEU.repository.UserRepository;
import nl.centric.innovation.local4localEU.service.impl.CaptchaServiceImpl;
import nl.centric.innovation.local4localEU.service.impl.EmailService;
import nl.centric.innovation.local4localEU.service.impl.LoginAttemptServiceImpl;
import nl.centric.innovation.local4localEU.service.impl.RecoverPasswordServiceImpl;
import nl.centric.innovation.local4localEU.service.impl.UserServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.provider.Arguments;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import lombok.SneakyThrows;
import util.SecurityUtils;

@ExtendWith(MockitoExtension.class)
public class UserServiceImplTests {
    @InjectMocks
    private UserServiceImpl userService;
    @Mock
    private UserRepository userRepository;

    @Mock
    private RecoverPasswordServiceImpl recoverPasswordService;

    @Mock
    private BCryptPasswordEncoder bCryptPasswordEncoder;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private CaptchaServiceImpl captchaService;

    @Mock
    private LoginAttemptServiceImpl loginAttemptService;

    @Mock
    private EmailService emailService;

    @Mock
    private HttpServletResponse response;

    @Value("${local4local.server.name}")
    private String baseURL;

    private static Stream<Arguments> customPasswords() {
        return Stream.of(
                Arguments.of("passwor"),
                Arguments.of("Password"),
                Arguments.of("Pas$word"),
                Arguments.of("Pas1word"),
                Arguments.of("pas1word"),
                Arguments.of("paS$word")
        );
    }

    private static Stream<Arguments> customInvalidEmails() {
        return Stream.of(
                Arguments.of("email"),
                Arguments.of("email@"),
                Arguments.of("emailll.com")
        );
    }

    private static final String SAMPLE_EMAIL = "email@domain.com";
    private static final String SAMPLE_RECAPTCHA = "reCaptcha";
    private static final String VALID_PASS = "Password1!";
    private static final String TOKEN = "validToken!";

    private static Stream<Arguments> customValidEmails() {
        return Stream.of(
                Arguments.of("ana+supplier@gmai.com"),
                Arguments.of("ana@centric.eu")
        );
    }

    @Test
    public void GivenNonExistingEmail_WhenHandlePasswordRecovery_ShouldThrowException() {
        RecoverPasswordDto recoverPasswordDTO = RecoverPasswordDto.builder()
                .email(SAMPLE_EMAIL)
                .reCaptchaResponse(SAMPLE_RECAPTCHA)
                .build();

        HttpServletRequest mockHttpServletRequest = mock(HttpServletRequest.class);
        String sampleLocale = "nl-NL";
        String remoteAddress = "127.0.0.1";
        String language = "Dutch";

        try (MockedStatic<SecurityUtils> mockedSecurityUtils = mockStatic(SecurityUtils.class);
             MockedStatic<util.StringUtils> mockedStringUtils = mockStatic(util.StringUtils.class)) {

            mockedSecurityUtils.when(() -> SecurityUtils.getClientIP(mockHttpServletRequest))
                    .thenReturn(remoteAddress);
            mockedStringUtils.when(() -> util.StringUtils.getLanguageForLocale(sampleLocale))
                    .thenReturn(language);


            when(userRepository.findByEmailIgnoreCase(SAMPLE_EMAIL)).thenReturn(Optional.empty());
            when(captchaService.isResponseValid(any(), any())).thenReturn(true);

            assertThrows(DtoValidateNotFoundException.class,
                    () -> userService.handlePasswordRecovery(recoverPasswordDTO, mockHttpServletRequest, sampleLocale));
        }
    }

    @Test
    public void GivenExceedingNumberOfTry_WhenCountAllInLastDay_ShouldThrowError() {
        RecoverPasswordDto recoverPasswordDTO = RecoverPasswordDto.builder()
                .email(SAMPLE_EMAIL)
                .reCaptchaResponse(SAMPLE_RECAPTCHA)
                .build();

        UUID userId = UUID.randomUUID();
        User user = new User();
        user.setId(userId);

        when(userRepository.findByEmailIgnoreCase(SAMPLE_EMAIL)).thenReturn(Optional.of(user));

        when(recoverPasswordService.countAllByUserInLastDay(user.getId())).thenReturn(3);

        when(captchaService.isResponseValid(any(), any())).thenReturn(true);

        assertThrows(RecoverException.class,
                () -> userService.handlePasswordRecovery(recoverPasswordDTO, mock(HttpServletRequest.class), "en"));
    }

    @Test
    public void GivenValidRecoverPasswordDTO_WhenBuild_ThenShouldNotBeNull() {
        RecoverPasswordDto recoverPasswordDTO = RecoverPasswordDto.builder()
                .email(SAMPLE_EMAIL)
                .reCaptchaResponse(SAMPLE_RECAPTCHA)
                .build();

        assertNotNull(recoverPasswordDTO);
        assertEquals(SAMPLE_EMAIL, recoverPasswordDTO.email());
        assertEquals(SAMPLE_RECAPTCHA, recoverPasswordDTO.reCaptchaResponse());
    }

    @Test
    public void GivenTwoRecords_WhenBuilding_ThenShouldHaveSameValue() {
        RecoverPasswordDto recoverPasswordDTO = RecoverPasswordDto.builder()
                .email(SAMPLE_EMAIL)
                .reCaptchaResponse(SAMPLE_RECAPTCHA)
                .build();

        RecoverPasswordDto newRecoverPasswordDTO = RecoverPasswordDto.builder()
                .email(SAMPLE_EMAIL)
                .reCaptchaResponse(SAMPLE_RECAPTCHA)
                .build();

        assertEquals(recoverPasswordDTO, newRecoverPasswordDTO);
    }

    @Test
    @SneakyThrows
    public void GivenValidDto_WhenChangePassword_ThenThePasswordShouldBeChanged() {
        UUID userId = UUID.randomUUID();
        User user = new User();
        user.setId(userId);
        user.setPassword("OldPassword1!");

        RecoverPassword recoverPassword = RecoverPassword.builder()
                .userId(userId)
                .build();

        when(recoverPasswordService.findRecoverPasswordByToken(TOKEN)).thenReturn(Optional.of(recoverPassword));
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));

        userService.changePassword(TOKEN, VALID_PASS);

        verify(recoverPasswordService).findRecoverPasswordByToken(TOKEN);
        verify(userRepository).findById(user.getId());
        verify(userRepository).save(user);
    }

    @Test
    @SneakyThrows
    public void GivenInvalidPassword_WhenChangePass_ThenErrorShouldBeThrown() {
        String rawPassword = "invalid!";

        assertThrows(DtoValidateException.class, () -> userService.changePassword(TOKEN, rawPassword));
    }

    @Test
    public void GivenInvalidToken_WhenNotFinding_ThenShouldThrownError() throws RecoverException, DtoValidateException, PasswordSameException {

        UUID userId = UUID.randomUUID();
        User user = new User();
        user.setId(userId);

        when(recoverPasswordService.findRecoverPasswordByToken(TOKEN)).thenReturn(Optional.empty());

        assertThrows(NoSuchElementException.class, () -> userService.changePassword(TOKEN, VALID_PASS));
    }

    @Test
    @SneakyThrows
    public void GivenSamePassword_WhenChangePassword_ThenErrorShouldBeThrown() {
        UUID userId = UUID.randomUUID();
        User user = new User();
        user.setId(userId);
        user.setPassword(VALID_PASS);

        RecoverPassword recoverPassword = RecoverPassword.builder()
                .userId(userId)
                .build();

        when(recoverPasswordService.findRecoverPasswordByToken(TOKEN)).thenReturn(Optional.of(recoverPassword));
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(bCryptPasswordEncoder.matches(VALID_PASS, user.getPassword())).thenReturn(true);

        assertThrows(PasswordSameException.class, () -> userService.changePassword(TOKEN, VALID_PASS));
    }

    @Test
    public void GivenInvalidCaptchaResponse_WhenRecoverPassword_ThenExpectCaptchaException() {
        RecoverPasswordDto recoverPasswordDTO = RecoverPasswordDto.builder()
                .email(SAMPLE_EMAIL)
                .reCaptchaResponse("invalid")
                .build();

        when(captchaService.isResponseValid(any(), any())).thenReturn(false);

        assertThrows(CaptchaException.class,
                () -> userService.handlePasswordRecovery(recoverPasswordDTO, mock(HttpServletRequest.class), "en"));
    }

    @Test
    public void GivenInvalidEmail_WhenRecoverPassword_ThenExpectDtoValidateException() {
        // Given
        String emailNotGood = "invalidEmail";
        RecoverPasswordDto recoverPasswordDTO = RecoverPasswordDto.builder()
                .email(emailNotGood)
                .reCaptchaResponse(SAMPLE_RECAPTCHA)
                .build();

        // Then
        assertThrows(DtoValidateException.class,
                () -> userService.handlePasswordRecovery(recoverPasswordDTO, mock(HttpServletRequest.class), "en"));
    }

    @Test
    @SneakyThrows
    public void GivenNotValidUserId_WhenChangePassword_ThenExpectDtoValidateNotFoundException() {
        // Given
        UUID userId = UUID.randomUUID();

        RecoverPassword recoverPassword = RecoverPassword.builder()
                .userId(userId)
                .build();

        // When
        when(recoverPasswordService.findRecoverPasswordByToken(TOKEN)).thenReturn(Optional.of(recoverPassword));
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        // Then
        assertThrows(DtoValidateNotFoundException.class, () -> userService.changePassword(TOKEN, VALID_PASS));
    }

    @Test
    public void GivenExistingManagers_WhenSendMerchantRegisteredEmail_ThenExpectSuccess() {
        // Given
        String merchantName = "Test merchant";
        String language = "nl-NL";

        UUID user1Id = UUID.randomUUID();
        User user1 = new User();
        user1.setId(user1Id);

        UUID user2Id = UUID.randomUUID();
        User user2 = new User();
        user2.setId(user2Id);

        List<User> managers = List.of(user1, user2);
        String[] managerEmails = managers.stream().map(User::getEmail).toArray(String[]::new);

        when(userRepository.findAll()).thenReturn(managers);

        // When
        userService.sendMerchantRegisteredEmail(merchantName, language);

        // Then
        verify(emailService).sendMerchantRegisteredEmail("null/merchants", language, merchantName, managerEmails);
    }

    @Test
    public void GivenNoManagers_WhenSendMerchantRegisteredEmail_ThenExpectNoEmailSent() {
        // Given
        String merchantName = "Test merchant";
        String language = "nl-NL";

        when(userRepository.findAll()).thenReturn(List.of());

        // When
        userService.sendMerchantRegisteredEmail(merchantName, language);

        // Then
        verify(emailService, never()).sendMerchantRegisteredEmail(anyString(), anyString(), anyString(), any());
    }

}

