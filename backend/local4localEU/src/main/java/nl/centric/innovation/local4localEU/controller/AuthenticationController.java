package nl.centric.innovation.local4localEU.controller;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nl.centric.innovation.local4localEU.dto.AuthResponseDto;
import nl.centric.innovation.local4localEU.dto.LoginRequestDto;
import nl.centric.innovation.local4localEU.dto.LoginResponseDto;
import nl.centric.innovation.local4localEU.exception.CustomException.AuthenticationLoginException;
import nl.centric.innovation.local4localEU.exception.CustomException.CaptchaException;
import nl.centric.innovation.local4localEU.exception.CustomException.DtoValidateNotFoundException;
import nl.centric.innovation.local4localEU.exception.CustomException.InvalidRoleException;
import nl.centric.innovation.local4localEU.exception.L4LEUException;
import nl.centric.innovation.local4localEU.exception.RefreshTokenException;
import nl.centric.innovation.local4localEU.service.impl.OtpResendService;
import nl.centric.innovation.local4localEU.service.interfaces.AuthenticationService;
import nl.centric.innovation.local4localEU.service.interfaces.OtpCodesService;
import nl.centric.innovation.local4localEU.service.interfaces.RefreshTokenService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequiredArgsConstructor
@RequestMapping("/public/authenticate")
public class AuthenticationController {

    private final AuthenticationService authService;

    private final RefreshTokenService refreshTokenService;

    private final OtpCodesService otpCodesService;

    private final OtpResendService otpResendService;

    @PostMapping
    public ResponseEntity<?> createAuthenticationToken(@RequestBody LoginRequestDto loginRequest,
                                                       @CookieValue(value = "language", defaultValue = "nl-NL") String language,
                                                       HttpServletRequest request)
            throws CaptchaException, L4LEUException, AuthenticationLoginException, InvalidRoleException {

        HttpHeaders httpHeaders = authService.authenticateByRole(loginRequest, language, request);
        return ResponseEntity.ok().headers(httpHeaders).build();
    }

    @PostMapping("/refreshToken")
    public ResponseEntity<?> refreshToken(@CookieValue(name = "refreshToken") String requestRefreshToken) throws RefreshTokenException {
        AuthResponseDto authResponseDto = refreshTokenService.refreshToken(requestRefreshToken);
        return ResponseEntity.ok().headers(authResponseDto.httpHeaders()).body(authResponseDto.loginResponseDto());
    }

    @GetMapping("/token/details")
    public ResponseEntity<LoginResponseDto> getTokenInfo(HttpServletRequest request) throws DtoValidateNotFoundException,
            AuthenticationLoginException {
        LoginResponseDto loginResponseDto = authService.getTokenInfo(request);
        return ResponseEntity.ok(loginResponseDto);
    }

    @PostMapping("/validateOtp")
    public ResponseEntity<LoginResponseDto> validateOtp(@RequestParam Integer otpCode, HttpServletRequest request) throws AuthenticationLoginException {
        AuthResponseDto authResponseDto = otpCodesService.validateOtp(request, otpCode);
        return ResponseEntity.ok().headers(authResponseDto.httpHeaders()).body(authResponseDto.loginResponseDto());
    }

    @PostMapping("/resendOtp")
    public ResponseEntity<Void> resendOtp(@CookieValue(value = "language", defaultValue = "nl-NL") String language,
                                                      HttpServletRequest request) throws Exception {
        HttpHeaders httpHeaders = otpResendService.resendOtp(language, request);
        return ResponseEntity.ok().headers(httpHeaders).build();
    }
    
}
