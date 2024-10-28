package nl.centric.innovation.local4localEU.controller;

import java.io.IOException;
import java.net.URISyntaxException;
import java.util.List;
import java.util.UUID;

import nl.centric.innovation.local4localEU.dto.InvitationDto;
import nl.centric.innovation.local4localEU.dto.RejectMerchantDto;
import nl.centric.innovation.local4localEU.exception.CustomException.TalerException;
import org.springframework.http.HttpStatus;
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

import lombok.RequiredArgsConstructor;
import nl.centric.innovation.local4localEU.dto.InviteMerchantDto;
import nl.centric.innovation.local4localEU.dto.MerchantDto;
import nl.centric.innovation.local4localEU.dto.MerchantViewDto;
import nl.centric.innovation.local4localEU.entity.Role;
import nl.centric.innovation.local4localEU.exception.CustomException.DtoValidateException;
import nl.centric.innovation.local4localEU.service.interfaces.MerchantInvitationService;
import nl.centric.innovation.local4localEU.service.interfaces.MerchantService;
import nl.centric.innovation.local4localEU.service.interfaces.UserService;
import org.springframework.beans.factory.annotation.Value;

@RestController
@RequiredArgsConstructor
@RequestMapping("/merchant")
public class MerchantController {
    private final MerchantService merchantService;
    private final MerchantInvitationService merchantInvitationService;
    private final UserService userService;

    @Value("${local4localEU.server.name}")
    private String baseURL;

    private static final String RESET_URL = "/recover/reset-password/";

    @RequestMapping(path = "/register", method = RequestMethod.POST)
    public ResponseEntity<MerchantDto> saveMerchant(@RequestBody MerchantDto merchantDto,
                                                    @CookieValue(value = "language", defaultValue = "nl-NL") String language) throws DtoValidateException {
        MerchantDto savedMerchant = merchantService.saveMerchant(merchantDto);
        userService.sendMerchantRegisteredEmail(merchantDto.companyName(), language);

        return ResponseEntity.ok(savedMerchant);
    }

    @RequestMapping(path = "/all", method = RequestMethod.GET)
    public ResponseEntity<List<MerchantViewDto>> getAllMerchants() {
        return ResponseEntity.ok(merchantService.getAllApproved());
    }

    @GetMapping("/paginated")
    @Secured({Role.ROLE_MANAGER})
    public ResponseEntity<List<MerchantViewDto>> getPaginatedMerchants(
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "25") Integer size) {
        return ResponseEntity.ok(merchantService.getPaginatedMerchants(page, size));
    }

    @RequestMapping(path = "/invitations", method = RequestMethod.GET)
    @Secured({Role.ROLE_MANAGER})
    public ResponseEntity<List<InvitationDto>> getInvitations(
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "25") Integer size) throws DtoValidateException {

        return ResponseEntity.ok(merchantInvitationService.getAllLatestSentToEmail(page, size));
    }

    @RequestMapping(path = "/filter/{categoryId}", method = RequestMethod.GET)
    public ResponseEntity<List<MerchantViewDto>> getMerchantsByCategory(@PathVariable Integer categoryId) {
        return ResponseEntity.ok(merchantService.getByCategory(categoryId));
    }

    @RequestMapping(path = "/count/all", method = RequestMethod.GET)
    @Secured({Role.ROLE_MANAGER})
    public ResponseEntity<Long> countAllMerchants() {
        return ResponseEntity.ok(merchantService.countAll());
    }

    @RequestMapping(path = "/invitations/count", method = RequestMethod.GET)
    @Secured({Role.ROLE_MANAGER})
    public ResponseEntity<Integer> countInvitations() throws DtoValidateException {
        return ResponseEntity.ok(merchantInvitationService.countInvitations());
    }

    @RequestMapping(path = "/invite", method = RequestMethod.POST)
    @Secured({Role.ROLE_MANAGER})
    public ResponseEntity<Void> inviteSupplier(@RequestBody InviteMerchantDto inviteMerchantDto,
                                               @CookieValue(value = "language", defaultValue = "nl-NL") String language) throws DtoValidateException {

        merchantInvitationService.save(inviteMerchantDto, language);
        return ResponseEntity.ok().build();
    }

    @RequestMapping(path = "/approve/{merchantId}", method = RequestMethod.PATCH)
    @Secured({Role.ROLE_MANAGER})
    public ResponseEntity<Void> approveMerchant(@PathVariable("merchantId") UUID merchantId,
                                                @CookieValue(value = "language", defaultValue = "nl-NL") String language)
            throws DtoValidateException, URISyntaxException, IOException, InterruptedException, TalerException {
        merchantService.approveMerchant(merchantId, language);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    @PostMapping(path = "/reject")
    @Secured({Role.ROLE_MANAGER})
    public ResponseEntity<Void> rejectMerchant(@RequestBody RejectMerchantDto rejectMerchantDto,
                                               @CookieValue(value = "language", defaultValue = "nl-NL") String language) throws DtoValidateException {
        merchantService.rejectMerchant(rejectMerchantDto, language);
        return ResponseEntity.ok().build();
    }
}
