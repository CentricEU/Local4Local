package nl.centric.innovation.local4localEU.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import nl.centric.innovation.local4localEU.dto.ChangePasswordDto;
import nl.centric.innovation.local4localEU.dto.RecoverPasswordDto;
import nl.centric.innovation.local4localEU.entity.RecoverPassword;
import nl.centric.innovation.local4localEU.exception.CustomException.CaptchaException;
import nl.centric.innovation.local4localEU.exception.CustomException.DtoValidateException;
import nl.centric.innovation.local4localEU.exception.CustomException.PasswordSameException;
import nl.centric.innovation.local4localEU.exception.CustomException.RecoverException;
import nl.centric.innovation.local4localEU.service.interfaces.RecoverPasswordService;
import nl.centric.innovation.local4localEU.service.interfaces.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@RestController
@RequiredArgsConstructor
@RequestMapping("/public/user")
public class UserController {

    private final UserService userService;

    private final RecoverPasswordService recoverPasswordService;

    @RequestMapping(method = RequestMethod.GET, path = "/recover")
    public ResponseEntity<RecoverPassword> getByToken(@RequestParam String token) throws DtoValidateException, RecoverException {
        Optional<RecoverPassword> recoverPassword = recoverPasswordService.findRecoverPasswordByToken(token);
        return ResponseEntity.ok(recoverPassword.get());
    }

    @RequestMapping(method = RequestMethod.POST, value = "/recover")
    public ResponseEntity<String> recoverPassword(@Valid @RequestBody RecoverPasswordDto recoverPasswordDto, @CookieValue(value = "language", defaultValue = "nl-NL") String locale, HttpServletRequest httpRequest) throws DtoValidateException, RecoverException, CaptchaException {
        userService.handlePasswordRecovery(recoverPasswordDto, httpRequest, locale);
        return ResponseEntity.noContent().build();
    }

    @RequestMapping(method = RequestMethod.PUT, value = "/recover/reset-password")
    public ResponseEntity<String> changePassword(@Valid @RequestBody ChangePasswordDto changePasswordDTO) throws RecoverException, DtoValidateException, PasswordSameException {
        userService.changePassword(changePasswordDTO.token(), changePasswordDTO.password());
        return ResponseEntity.noContent().build();
    }
}
