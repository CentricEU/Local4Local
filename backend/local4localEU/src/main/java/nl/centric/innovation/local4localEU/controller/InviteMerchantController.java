package nl.centric.innovation.local4localEU.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import lombok.RequiredArgsConstructor;
import nl.centric.innovation.local4localEU.dto.InvitationDto;
import nl.centric.innovation.local4localEU.dto.InviteMerchantDto;
import nl.centric.innovation.local4localEU.entity.Role;
import nl.centric.innovation.local4localEU.exception.CustomException.DtoValidateException;
import nl.centric.innovation.local4localEU.service.impl.MerchantInvitationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/invitations")
public class InviteMerchantController {

    private final MerchantInvitationService merchantInvitationService;

    @GetMapping()
    @Secured({Role.ROLE_MANAGER})
    public ResponseEntity<List<InvitationDto>> getInvitations(
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "25") Integer size) {

        return ResponseEntity.ok(merchantInvitationService.getAllLatestSentToEmail(page, size));
    }

    @RequestMapping(path = "/count", method = RequestMethod.GET)
    @Secured({Role.ROLE_MANAGER})
    public ResponseEntity<Integer> countInvitations() throws DtoValidateException {
        return ResponseEntity.ok(merchantInvitationService.countInvitations());
    }

    @RequestMapping(path = "/send", method = RequestMethod.POST)
    @Secured({Role.ROLE_MANAGER})
    public ResponseEntity<Void> inviteMerchant(@RequestBody InviteMerchantDto inviteMerchantDto,
                                               @CookieValue(value = "language", defaultValue = "nl-NL")
                                               String language) throws DtoValidateException {

        merchantInvitationService.inviteMerchant(inviteMerchantDto, language);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/public/validate/{token}")
    @Operation(
            summary = "Validate an invitation token",
            description = "Validates an invitation token using the provided token."
    )
    public ResponseEntity<UUID> validateInvitationToken(
            @Parameter(description = "The invitation token to validate", required = true)
            @PathVariable("token") UUID token) throws DtoValidateException {
        merchantInvitationService.validateInvitationToken(token);
        return ResponseEntity.ok(token);
    }
}
