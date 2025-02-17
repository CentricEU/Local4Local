package nl.centric.innovation.local4localEU.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import jakarta.validation.Valid;
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

    @GetMapping("/count")
    @Secured({Role.ROLE_MANAGER})
    public ResponseEntity<Integer> countInvitations() {
        return ResponseEntity.ok(merchantInvitationService.countInvitations());
    }

    @PostMapping("/send")
    @Secured({Role.ROLE_MANAGER})
    @Operation(
            summary = "Invite a merchant",
            description = "Sends an invitation to a merchant using the provided details.",
            responses = {
                    @ApiResponse(responseCode = "200",
                            description = "Returns false if all emails were processed, true if some emails were skipped.")
            }
    )
    public ResponseEntity<Boolean> inviteMerchant(@RequestBody @Valid InviteMerchantDto inviteMerchantDto,
                                                  @CookieValue(value = "language", defaultValue = "nl-NL")
                                                  String language) throws DtoValidateException {

        boolean skippedEmailsExist = merchantInvitationService.inviteMerchant(inviteMerchantDto, language);
        return ResponseEntity.ok(skippedEmailsExist);
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
