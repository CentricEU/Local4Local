package nl.centric.innovation.local4localEU.unit;

import static junit.framework.TestCase.assertTrue;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import lombok.SneakyThrows;
import nl.centric.innovation.local4localEU.dto.InvitationDto;
import nl.centric.innovation.local4localEU.exception.CustomException.DtoValidateNotFoundException;
import nl.centric.innovation.local4localEU.service.impl.EmailService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Value;

import nl.centric.innovation.local4localEU.dto.InviteMerchantDto;
import nl.centric.innovation.local4localEU.entity.MerchantInvitation;
import nl.centric.innovation.local4localEU.exception.CustomException.DtoValidateException;
import nl.centric.innovation.local4localEU.repository.MerchantInvitationRepository;
import nl.centric.innovation.local4localEU.service.impl.MerchantInvitationService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

@ExtendWith(MockitoExtension.class)
public class MerchantInvitationServiceImplTest {

    @InjectMocks
    private MerchantInvitationService merchantInvitationService;

    @Mock
    private EmailService emailService;

    @Mock
    private MerchantInvitationRepository merchantInvitationRepository;
    @Value("${error.constraint.duplicate}")
    private String duplicateValue;

    @Value("${error.TooManyEmails}")
    private String errorTooManyEmails;

    @Value("${error.entity.notfound}")
    private String errorEntityNotFound;

    @Value("${error.invitation.expired}")
    private String errorInvitationExpired;

    @Test
    void GivenTooManyEmails_WhenSave_ThenExpectDtoValidateException() {
        InviteMerchantDto dto = InviteMerchantDto.builder()
                .emails(Arrays.asList(new String[51])) // More than 50 emails
                .build();
        assertThrows(DtoValidateException.class, () -> {
            merchantInvitationService.inviteMerchant(dto, "en");
        });
    }

    @Test
    void GivenDuplicatesEmails_WhenSave_ThenExpectDtoValidateException() {
        InviteMerchantDto dto = InviteMerchantDto.builder()
                .emails(Arrays.asList("test@example.com", "test@example.com"))
                .build();

        assertThrows(DtoValidateException.class, () -> {
            merchantInvitationService.inviteMerchant(dto, "en");
        });
    }

    @Test
    void GivenEmptyMessage_WhenSave_ThenExpectDtoValidateException() {
        InviteMerchantDto dto = InviteMerchantDto.builder()
                .emails(Arrays.asList("test@example.com"))
                .build();

        assertThrows(DtoValidateException.class, () -> {
            merchantInvitationService.inviteMerchant(dto, "en");
        });
    }

    @Test
    @SneakyThrows
    void GivenValidInviteMerchantDto_WhenSave_ThenMerchantInvitationIsSavedAndEmailsAreSent() {
        // Given
        InviteMerchantDto dto = InviteMerchantDto.builder()
                .emails(Arrays.asList("test1@example.com", "test2@example.com"))
                .message("Join us!")
                .build();

        // When
        merchantInvitationService.inviteMerchant(dto, "en");

        // Then
        ArgumentCaptor<Collection<MerchantInvitation>> captor = ArgumentCaptor.forClass(Collection.class);
        verify(merchantInvitationRepository, times(1)).saveAll(captor.capture());

        // Verify
        Collection<MerchantInvitation> capturedInvitations = captor.getValue();
        assertEquals(2, capturedInvitations.size());

        MerchantInvitation firstInvitation = capturedInvitations.iterator().next();
        assertNotNull(firstInvitation.getToken());
        assertTrue(firstInvitation.getEmail().equals("test1@example.com") || firstInvitation.getEmail().equals("test2@example.com"));

        verify(emailService, times(1)).sendInviteMerchantEmail(anyString(), any(), anyString());
    }

    @Test
    void GivenValidPageRequest_WhenGetAllLatestSentToEmail_ThenReturnListOfInvitationDto() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 2);
        MerchantInvitation invitation1 = new MerchantInvitation();
        invitation1.setEmail("test1@example.com");
        invitation1.setCreatedDate(LocalDateTime.now());
        invitation1.setActive(true);

        MerchantInvitation invitation2 = new MerchantInvitation();
        invitation2.setEmail("test2@example.com");
        invitation2.setCreatedDate(LocalDateTime.now());
        invitation2.setActive(true);

        Page<MerchantInvitation> page = new PageImpl<>(Arrays.asList(invitation1, invitation2), pageable, 2);

        when(merchantInvitationRepository.findAllByIsActiveTrueOrderByCreatedDateDesc(any(Pageable.class))).thenReturn(page);

        // Act
        List<InvitationDto> result = merchantInvitationService.getAllLatestSentToEmail(0, 2);

        // Assert
        assertEquals(2, result.size());
        assertEquals("test1@example.com", result.get(0).email());
        assertEquals("test2@example.com", result.get(1).email());
    }

    @Test
    void GivenActiveInvitations_WhenCountInvitations_ThenReturnCorrectCount() {
        // Arrange
        Integer activeInvitationsCount = 10; // Example count value
        when(merchantInvitationRepository.countByIsActiveTrue()).thenReturn(activeInvitationsCount);

        // Act
        Integer result = merchantInvitationService.countInvitations();

        // Assert
        assertEquals(activeInvitationsCount, result);
    }

    @Test
    void GivenValidToken_WhenValidateInvitationLink_ThenNoExceptionThrown() {
        UUID token = UUID.randomUUID();
        MerchantInvitation invitation = new MerchantInvitation();
        invitation.setToken(token);
        invitation.setTokenExpirationDate(LocalDateTime.now().plusDays(1));

        when(merchantInvitationRepository.findByToken(token)).thenReturn(Optional.of(invitation));

        assertDoesNotThrow(() -> merchantInvitationService.validateInvitationToken(token));
    }

    @Test
    void GivenNonExistentToken_WhenValidateInvitationLink_ThenThrowDtoValidateNotFoundException() {
        UUID token = UUID.randomUUID();

        when(merchantInvitationRepository.findByToken(token)).thenReturn(Optional.empty());

        DtoValidateNotFoundException exception = assertThrows(DtoValidateNotFoundException.class, () -> {
            merchantInvitationService.validateInvitationToken(token);
        });

        assertEquals(errorEntityNotFound, exception.getMessage());
    }

    @Test
    void GivenExpiredToken_WhenValidateInvitationLink_ThenThrowDtoValidateNotFoundException() {
        UUID token = UUID.randomUUID();
        MerchantInvitation invitation = new MerchantInvitation();
        invitation.setToken(token);
        invitation.setTokenExpirationDate(LocalDateTime.now().minusDays(1));

        when(merchantInvitationRepository.findByToken(token)).thenReturn(Optional.of(invitation));

        DtoValidateNotFoundException exception = assertThrows(DtoValidateNotFoundException.class, () -> {
            merchantInvitationService.validateInvitationToken(token);
        });

        assertEquals(errorInvitationExpired, exception.getMessage());
    }
}
