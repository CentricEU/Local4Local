package nl.centric.innovation.local4localEU.unit;

import static org.junit.Assert.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import nl.centric.innovation.local4localEU.dto.InvitationDto;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Value;

import nl.centric.innovation.local4localEU.dto.InviteMerchantDto;
import nl.centric.innovation.local4localEU.entity.MerchantInvitation;
import nl.centric.innovation.local4localEU.exception.CustomException.DtoValidateException;
import nl.centric.innovation.local4localEU.repository.MerchantInvitationRepository;
import nl.centric.innovation.local4localEU.service.impl.MerchantInvitationServiceImpl;
import nl.centric.innovation.local4localEU.service.interfaces.EmailService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

@ExtendWith(MockitoExtension.class)
public class MerchantInvitationServiceImplTest {

    @InjectMocks
    private MerchantInvitationServiceImpl merchantInvitationService;

    @Mock
    private EmailService emailService;

    @Mock
    private MerchantInvitationRepository merchantInvitationRepository;
    @Value("${error.constraint.duplicate}")
    private String duplicateValue;

    @Value("${error.TooManyEmails}")
    private String errorTooManyEmails;


    @Test
    void GivenTooManyEmails_WhenSave_ThenExpectDtoValidateException() {
        InviteMerchantDto dto = InviteMerchantDto.builder()
                .emails(Arrays.asList(new String[51])) // More than 50 emails
                .build();
        assertThrows(DtoValidateException.class, () -> {
            merchantInvitationService.save(dto, "en");
        });
    }

    @Test
    void GivenDuplicatesEmails_WhenSave_ThenExpectDtoValidateException() {
        InviteMerchantDto dto = InviteMerchantDto.builder()
                .emails(Arrays.asList("test@example.com", "test@example.com"))
                .build();

        assertThrows(DtoValidateException.class, () -> {
            merchantInvitationService.save(dto, "en");
        });
    }

    @Test
    void GivenEmptyMessage_WhenSave_ThenExpectDtoValidateException() {
        InviteMerchantDto dto = InviteMerchantDto.builder()
                .emails(Arrays.asList("test@example.com"))
                .build();

        assertThrows(DtoValidateException.class, () -> {
            merchantInvitationService.save(dto, "en");
        });
    }

    @Test
    void GivenValidInviteMerchantDto_WhenSave_ThenMerchantInvitationIsSavedAndEmailsAreSent() throws DtoValidateException {
        InviteMerchantDto dto = InviteMerchantDto.builder()
                .emails(Arrays.asList("test1@example.com", "test2@example.com"))
                .message("Join us!")
                .build();

        merchantInvitationService.save(dto, "en");

        verify(merchantInvitationRepository, times(2)).save(any(MerchantInvitation.class));
        verify(emailService, times(1)).sendInviteMerchantEmail(any(), anyString(), any(), anyString());
    }

    @Test
    void GivenValidPageRequest_WhenGetAllLatestSentToEmail_ThenReturnListOfInvitationDto() throws DtoValidateException {
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
}
