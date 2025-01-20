package nl.centric.innovation.local4localEU.unit;

import com.amazonaws.services.simpleemail.AmazonSimpleEmailService;
import com.amazonaws.services.simpleemail.model.Body;
import com.amazonaws.services.simpleemail.model.Content;
import com.amazonaws.services.simpleemail.model.Destination;
import com.amazonaws.services.simpleemail.model.Message;
import com.amazonaws.services.simpleemail.model.MessageRejectedException;
import com.amazonaws.services.simpleemail.model.SendEmailRequest;
import com.amazonaws.services.simpleemail.model.SendEmailResult;
import lombok.SneakyThrows;
import nl.centric.innovation.local4localEU.enums.EmailStructureEnum;
import nl.centric.innovation.local4localEU.service.impl.EmailService;
import nl.centric.innovation.local4localEU.service.interfaces.MailTemplateBuilder;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.support.ResourceBundleMessageSource;
import org.springframework.test.util.ReflectionTestUtils;
import util.MailTemplate;

import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class EmailServiceImplTests {
    @InjectMocks
    private EmailService emailService;
    @Mock
    private AmazonSimpleEmailService amazonEmailService;

    @Mock
    private MailTemplateBuilder mailTemplateBuilder;

    private SendEmailRequest expectedRequest;

    @BeforeEach
    public void setUp() {

        ResourceBundleMessageSource messageSource = new ResourceBundleMessageSource();
        messageSource.setBasenames("i18n/messages");
        messageSource.setUseCodeAsDefaultMessage(true);

        ReflectionTestUtils.setField(emailService, "messageSource", messageSource);
    }

    @Test
    void GivenValid_WhenSendPasswordRecoveryEmail_ThenExpectAmazonEmailServiceToBeCalled() {
        // Given
        String url = "http://example.com";
        String[] toAddress = {"to@example.com"};
        String language = "en";
        String htmlContent = "<html><body><h1>Test Content</h1></body></html>";

        when(mailTemplateBuilder.buildEmailTemplate(any())).thenReturn(htmlContent);
        when(amazonEmailService.sendEmail(any())).thenReturn(null);

        // When
        emailService.sendPasswordRecoveryEmail(url, toAddress, language);

        // Then
        verify(mailTemplateBuilder, times(1)).buildEmailTemplate(any());
        verify(amazonEmailService, times(1)).sendEmail(any());
    }

    @Test
    @SneakyThrows
    public void GivenNotValid_WhenSendEmail_ThenExpectError() {
        when(amazonEmailService.sendEmail(expectedRequest)).thenThrow(MessageRejectedException.class);
        assertThrows(MessageRejectedException.class, () -> amazonEmailService.sendEmail(expectedRequest));
    }

    @Test
    public void GivenValidRequest_WhenSendEmail_ThenResponseShouldNotBeNull() {
        when(amazonEmailService.sendEmail(expectedRequest)).thenReturn(new SendEmailResult());
        SendEmailResult response = amazonEmailService.sendEmail(expectedRequest);
        assertNotNull(response);
    }

    @Test
    public void GivenValidMailTemplate_WhenBuildingTemplateText_ThenExpectAllFieldToBePresent() {
        // Given
        MailTemplate mailTemplate = MailTemplate.builder()
                .locale(new Locale("nl-NL"))
                .logoImage(EmailStructureEnum.LOGO_IMAGE.getStructure())
                .title(EmailStructureEnum.TITLE.getStructure())
                .content(EmailStructureEnum.CONTENT.getStructure())
                .url(EmailStructureEnum.URL.getStructure())
                .action(EmailStructureEnum.ACTION.getStructure())
                .subject(EmailStructureEnum.SUBJECT.getStructure())
                .btnText(EmailStructureEnum.BTN_TEXT.getStructure())
                .closing(EmailStructureEnum.CLOSING.getStructure())
                .build();

        // When
        String textContent = ReflectionTestUtils.invokeMethod(emailService, "buildTemplateText", mailTemplate);

        // Then
        assertNotNull(textContent);
        assertTrue(textContent.contains(mailTemplate.getTitle()));
        assertTrue(textContent.contains(mailTemplate.getContent()));
        assertTrue(textContent.contains(mailTemplate.getAction()));
        assertTrue(textContent.contains(mailTemplate.getUrl()));
        assertTrue(textContent.contains(mailTemplate.getClosing()));
        assertFalse(textContent.contains(mailTemplate.getLogoImage()));
        assertFalse(textContent.contains(mailTemplate.getBtnText()));
    }

    @Test
    void GivenValid_WhenSendEmail_ThenExpectAmazonEmailServiceToBeCalled() {
        // Given
        String fromAddr = "from@example.com";
        String[] toAddr = {"to@example.com"};
        String subject = "Test Subject";
        String htmlContent = "<html><body><h1>Hello</h1></body></html>";
        String textContent = "Hello";

        SendEmailRequest expectedRequest = new SendEmailRequest()
                .withDestination(new Destination().withToAddresses(toAddr))
                .withMessage(new Message()
                        .withBody(new Body()
                                .withHtml(new Content().withCharset(EmailService.UTF_8).withData(htmlContent))
                                .withText(new Content().withCharset(EmailService.UTF_8).withData(textContent)))
                        .withSubject(new Content().withCharset(EmailService.UTF_8).withData(subject)))
                .withSource(fromAddr);

        // When
        emailService.sendEmail(fromAddr, toAddr, subject, htmlContent, textContent);

        // Then
        verify(amazonEmailService).sendEmail(expectedRequest);
    }

    @Test
    void GivenValidInformation_WhenSendInviteSupplierEmail_ThenExpectAmazonEmailServiceToBeCalled() {
        // Given
        Map<String,UUID> toAddress = Map.of("email@domain.com", UUID.randomUUID());
        String language = "en";
        String message = "Test message";
        String htmlContent = "<html><body><h1>Test Content</h1></body></html>";
        when(mailTemplateBuilder.buildEmailTemplate(any())).thenReturn(htmlContent);
        when(amazonEmailService.sendEmail(any())).thenReturn(null);
        // When
        emailService.sendInviteMerchantEmail(language, toAddress, message);

        // Then
        verify(mailTemplateBuilder, times(1)).buildEmailTemplate(any());
        verify(amazonEmailService, times(1)).sendEmail(any());
    }

    @Test
    void GivenValidInformation_WhenSendMerchantRegisteredEmail_ThenExpectAmazonEmailServiceToBeCalled() {
        // Given
        String url = "http://example.com";
        String[] toAddress = {"email@domain.com"};
        String language = "en";
        String message = "Test message";
        String htmlContent = "<html><body><h1>Test Content</h1></body></html>";
        when(mailTemplateBuilder.buildEmailTemplate(any())).thenReturn(htmlContent);
        when(amazonEmailService.sendEmail(any())).thenReturn(null);

        // When
        emailService.sendMerchantRegisteredEmail("/merchant", language, message, toAddress);

        // Then
        verify(mailTemplateBuilder, times(1)).buildEmailTemplate(any());
        verify(amazonEmailService, times(1)).sendEmail(any());
    }

    @Test
    void GivenValidInformation_WhenSendManagerOtpEmail_ThenExpectAmazonEmailServiceToBeCalled() {
        // Given
        String language = "en";
        String[] managerEmail = {"manager@example.com"};
        Integer otpCode = 123456;
        String htmlContent = "<html><body><h1>OTP: 123456</h1></body></html>";
        MailTemplate mailTemplate = MailTemplate.builder()
                .locale(new Locale(language))
                .subject("Your OTP Code")
                .content("OTP: " + otpCode)
                .build();

        when(mailTemplateBuilder.buildEmailTemplate(any())).thenReturn(htmlContent);

        // When
        emailService.sendManagerOtpEmail(language, managerEmail, otpCode);

        // Then
        verify(mailTemplateBuilder, times(1)).buildEmailTemplate(any());
        verify(amazonEmailService, times(1)).sendEmail(any(SendEmailRequest.class));
    }


    @Test
    void sendEmail_MessageRejected() {
        // Given
        String fromAddr = "from@example.com";
        String[] toAddr = {"to@example.com"};
        String subject = "Test Subject";
        String htmlContent = "<html><body><h1>Hello</h1></body></html>";
        String textContent = "Hello";

        doThrow(MessageRejectedException.class).when(amazonEmailService).sendEmail(any(SendEmailRequest.class));

        // When
        emailService.sendEmail(fromAddr, toAddr, subject, htmlContent, textContent);
    }

    @Test
    void GivenValidInformation_WhenSendApproveMerchantEmail_ThenExpectAmazonEmailServiceToBeCalled() {
        // Given
        String[] toAddress = {"email@domain.com"};
        String language = "en";
        String companyName = "Test Company";
        String baseURL = "http://example.com"; // Set the base URL to mock the real environment

        // Mocking a template for approval email
        MailTemplate mailTemplate = MailTemplate.builder()
                .locale(new Locale(language))
                .subject("Merchant Approval")
                .content(companyName + " has been approved!")
                .build();

        String htmlContent = "<html><body><h1>Merchant Approval: " + companyName + "</h1></body></html>";
        String textContent = "Merchant Approval: " + companyName;

        // Mock the behavior of the mailTemplateBuilder and sendEmail methods
        when(mailTemplateBuilder.buildEmailTemplate(any(MailTemplate.class))).thenReturn(htmlContent);

        // When
        emailService.sendApproveMerchantEmail(toAddress, language, companyName, UUID.randomUUID(), "MerchantName");

        // Then
        verify(mailTemplateBuilder, times(1)).buildEmailTemplate(any(MailTemplate.class));
        verify(amazonEmailService, times(1)).sendEmail(any(SendEmailRequest.class));
    }

    @Test
    public void GivenValidRejectMerchantEmail_WhenSendRejectMerchantEmail_ThenExpectAmazonEmailServiceToBeCalled() {
        // Given
        String[] toAddress = {"to@example.com"};
        String language = "en";
        String companyName = "Test Company";
        String reason = "Reason for rejection";

        MailTemplate mailTemplate = MailTemplate.builder()
                .locale(new Locale(language))
                .subject("Rejection of " + companyName)
                .content(companyName + " has been rejected for the following reason: " + reason)
                .build();

        String htmlContent = "<html><body><h1>Rejection: " + companyName + "</h1><p>Reason: " + reason + "</p></body></html>";
        String textContent = "Rejection: " + companyName + "\nReason: " + reason;

        when(mailTemplateBuilder.buildEmailTemplate(any(MailTemplate.class))).thenReturn(htmlContent);

        // When
        emailService.sendRejectMerchantEmail(toAddress, language, companyName, reason);

        // Then
        verify(mailTemplateBuilder, times(1)).buildEmailTemplate(any(MailTemplate.class));
        verify(amazonEmailService, times(1)).sendEmail(any(SendEmailRequest.class));
    }

    @Test
    public void GivenNullToAddress_WhenSendRejectMerchantEmail_ThenShouldThrowException() {
        // Given
        String[] toAddress = null;
        String language = "en";
        String companyName = "Test Company";
        String reason = "Reason for rejection";

        // When & Then
        assertThrows(NullPointerException.class, () -> {
            emailService.sendRejectMerchantEmail(toAddress, language, companyName, reason);
        });
    }
}

