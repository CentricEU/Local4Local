package nl.centric.innovation.local4localEU.service.impl;

import io.hypersistence.utils.common.StringUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nl.centric.innovation.local4localEU.dto.RecoverPasswordDto;
import nl.centric.innovation.local4localEU.entity.LoginAttempt;
import nl.centric.innovation.local4localEU.entity.RecoverPassword;
import nl.centric.innovation.local4localEU.entity.User;
import nl.centric.innovation.local4localEU.exception.CustomException.CaptchaException;
import nl.centric.innovation.local4localEU.exception.CustomException.DtoValidateException;
import nl.centric.innovation.local4localEU.exception.CustomException.DtoValidateNotFoundException;
import nl.centric.innovation.local4localEU.exception.CustomException.PasswordSameException;
import nl.centric.innovation.local4localEU.exception.CustomException.RecoverException;
import nl.centric.innovation.local4localEU.repository.UserRepository;
import nl.centric.innovation.local4localEU.service.interfaces.CaptchaService;
import nl.centric.innovation.local4localEU.service.interfaces.LoginAttemptService;
import nl.centric.innovation.local4localEU.service.interfaces.RecoverPasswordService;
import nl.centric.innovation.local4localEU.service.interfaces.UserService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.PropertySource;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import util.SecurityUtils;

import javax.mail.internet.AddressException;
import javax.mail.internet.InternetAddress;

import java.util.Optional;
import java.util.regex.Pattern;
import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
@PropertySource({"classpath:errorcodes.properties"})
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    private final CaptchaService captchaService;

    private final RecoverPasswordService recoverPasswordService;

    private final LoginAttemptService loginAttemptService;

    private final BCryptPasswordEncoder bCryptPasswordEncoder;

    private final EmailService emailService;

    @Value("${error.captcha.show}")
    private String errorCaptchaShow;

    @Value("${error.entity.notfound}")
    private String errorEntityNotFound;

    @Value("${error.recovery.exceeded}")
    private String errorRecoveryExceeded;

    @Value("${error.mail.requirements}")
    private String errorMailRequirements;

    @Value("${error.recovery.samePassword}")
    private String errorSamePassword;

    @Value("${error.passwords.requirements}")
    private String errorPasswordRequirements;

    @Value("${local4localEU.server.name}")
    private String baseURL;

    private static final int ATTEMPTS_LIMIT = 3;
    private static final String RESET_URL = "/recover/reset-password/";
    private static final String MERCHANTS_URL = "/merchants";

    @Override
    public Optional<User> findByUsername(String email) {
        return userRepository.findByEmailIgnoreCase(email);
    }

    @Override
    public void changePassword(String token, String rawPassword)
            throws RecoverException, DtoValidateException, PasswordSameException {

        if (!isPasswordValid(rawPassword)) {
            throw new DtoValidateException(errorPasswordRequirements);
        }

        Optional<RecoverPassword> rp = recoverPasswordService.findRecoverPasswordByToken(token);
        Optional<User> user = userRepository.findById(rp.get().getUserId());

        if (rp.isEmpty() || user.isEmpty()) {
            throw new DtoValidateNotFoundException(errorEntityNotFound);
        }

        if (bCryptPasswordEncoder.matches(rawPassword, user.get().getPassword())) {
            throw new PasswordSameException(errorSamePassword);
        }

        User updatedUser = user.get();
        updatedUser.setPassword(bCryptPasswordEncoder.encode(rawPassword));
        userRepository.save(updatedUser);
        rp.get().setIsActive(false);
        recoverPasswordService.save(rp.get());
    }

    @Override
    public void sendMerchantRegisteredEmail(String merchantName, String language) {
        List<User> managers = userRepository.findAll();
        String[] managerEmails = managers.stream().map(User::getEmail).toArray(String[]::new);
        String url = baseURL + MERCHANTS_URL;

        if (managerEmails.length == 0) {
            return;
        }

        emailService.sendMerchantRegisteredEmail(url, language, merchantName, managerEmails);
    }

    public void handlePasswordRecovery(RecoverPasswordDto recoverPasswordDto, HttpServletRequest httpRequest, String locale) throws DtoValidateException, RecoverException, CaptchaException {
        String remoteAddress = SecurityUtils.getClientIP(httpRequest);
        String language = util.StringUtils.getLanguageForLocale(locale);

        RecoverPassword recoverPassword = recoverPassword(recoverPasswordDto, remoteAddress, language);
        String url = baseURL + RESET_URL + recoverPassword.getToken();
        String[] emailArray = new String[]{recoverPasswordDto.email()};
        emailService.sendPasswordRecoveryEmail(url, emailArray, locale);
    }

    private boolean isPasswordValid(String password) {
        String regexPattern = "^(?=.*[A-Z])(?=.*[0-9])(?=.*[~`!@#$%^&*()_\\-+={[}]|\\\\:;\"'<,>.?/])(.{8,})$";

        return Pattern.compile(regexPattern).matcher(password).matches();
    }

    private RecoverPassword recoverPassword(RecoverPasswordDto recoverPasswordDto, String remoteAddress, String language)
            throws RecoverException, DtoValidateException, CaptchaException {
        validateEmail(recoverPasswordDto.email());

        Optional<User> user = findByUsername(recoverPasswordDto.email());

        if (StringUtils.isBlank(recoverPasswordDto.reCaptchaResponse())
                || !captchaService.isResponseValid(recoverPasswordDto.reCaptchaResponse(), remoteAddress)) {
            throw new CaptchaException(errorCaptchaShow);
        }

        if (user.isEmpty()) {
            throw new DtoValidateNotFoundException(errorEntityNotFound);
        }

        Integer recoverPassCount = recoverPasswordService.countAllByUserInLastDay(user.get().getId());

        if (recoverPassCount >= ATTEMPTS_LIMIT) {
            throw new RecoverException(errorRecoveryExceeded);
        }

        Optional<LoginAttempt> loginAttempt = loginAttemptService.findByRemoteAddress(remoteAddress);
        loginAttemptService.countLoginAttempts(loginAttempt, remoteAddress, true);

        RecoverPassword recoverPassword = RecoverPassword.of(user.get().getId());

        return recoverPasswordService.save(recoverPassword);
    }

    private void validateEmail(String email) throws DtoValidateException {
        try {
            InternetAddress address = new InternetAddress(email);
            address.validate();
        } catch (AddressException e) {
            log.error("Invalid email address submitted {}", email, e);
            throw new DtoValidateException(errorMailRequirements);
        }
    }
}
