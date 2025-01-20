package nl.centric.innovation.local4localEU.service.impl;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import nl.centric.innovation.local4localEU.dto.InvitationDto;
import nl.centric.innovation.local4localEU.exception.CustomException.DtoValidateNotFoundException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.PropertySource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import nl.centric.innovation.local4localEU.dto.InviteMerchantDto;
import nl.centric.innovation.local4localEU.entity.MerchantInvitation;
import nl.centric.innovation.local4localEU.exception.CustomException.DtoValidateException;
import nl.centric.innovation.local4localEU.repository.MerchantInvitationRepository;
import nl.centric.innovation.local4localEU.service.interfaces.EmailService;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@PropertySource({"classpath:errorcodes.properties"})
public class MerchantInvitationService {

    private final EmailService emailService;

    private final MerchantInvitationRepository merchantInvitationRepository;

    @Value("${error.constraint.duplicate}")
    private String duplicateValue;

    @Value("${error.TooManyEmails}")
    private String errorTooManyEmails;

    @Value("${local4localEU.server.name}")
    private String baseURL;

    @Value("${error.general.entityValidate}")
    private String errorEntityValidate;

    @Value("${error.entity.notfound}")
    private String errorEntityNotFound;

    @Value("${error.invitation.expired}")
    private String errorInvitationExpired;

    @Transactional
    public void inviteMerchant(InviteMerchantDto inviteMerchantDto, String language) throws DtoValidateException {
        validateInviteMerchantDto(inviteMerchantDto);
        Map<String, UUID> processedEmails = processEmails(inviteMerchantDto);
        emailService.sendInviteMerchantEmail(language, processedEmails, inviteMerchantDto.message());
    }

    public List<InvitationDto> getAllLatestSentToEmail(Integer page, Integer size) {
        Pageable pageable = PageRequest.of(page, size);

        Page<MerchantInvitation> invitations = merchantInvitationRepository
                .findAllByIsActiveTrueOrderByCreatedDateDesc(pageable);

        return invitations.stream().map(InvitationDto::toDto).collect(Collectors.toList());
    }

    public Integer countInvitations() {
        return merchantInvitationRepository.countByIsActiveTrue();
    }

    public void validateInvitationToken(UUID token) throws DtoValidateNotFoundException {
        Optional<MerchantInvitation> merchantInvitation = merchantInvitationRepository.findByToken(token);

        if (merchantInvitation.isEmpty()) {
            throw new DtoValidateNotFoundException(errorEntityNotFound);
        }

        if (!isTokenValid(merchantInvitation.get().getTokenExpirationDate())) {
            throw new DtoValidateNotFoundException(errorInvitationExpired);
        }
    }

    private boolean isTokenValid(LocalDateTime expirationDate) {
        return Optional.ofNullable(expirationDate)
                .map(date -> date.isAfter(LocalDateTime.now())).orElse(false);
    }

    private void validateInviteMerchantDto(InviteMerchantDto inviteMerchantDto) throws DtoValidateException {
        if (inviteMerchantDto.emails().size() > 50) {
            throw new DtoValidateException(errorTooManyEmails);
        }

        if (inviteMerchantDto.message() == null || inviteMerchantDto.message().isEmpty()
                || inviteMerchantDto.message().length() > 1024) {
            throw new DtoValidateException(errorEntityValidate);
        }
    }

    private Map<String, UUID> processEmails(InviteMerchantDto inviteMerchantDto) throws DtoValidateException {
        // Check for duplicates in the input list first
        List<String> emails = inviteMerchantDto.emails();

        if (emails.size() != new HashSet<>(emails).size()) {
            throw new DtoValidateException(duplicateValue);
        }

        Map<String, UUID> emailTokenMap = new HashMap<>();
        Set<MerchantInvitation> invitations = emails.stream()
                .map(email -> {
                    MerchantInvitation invitation = MerchantInvitation.of(email, inviteMerchantDto.message());
                    emailTokenMap.put(email, invitation.getToken());
                    return invitation;
                })
                .collect(Collectors.toSet());

        merchantInvitationRepository.saveAll(invitations);

        return emailTokenMap;
    }
}
