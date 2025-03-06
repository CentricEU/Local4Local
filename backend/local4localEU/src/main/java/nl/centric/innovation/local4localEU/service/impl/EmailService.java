package nl.centric.innovation.local4localEU.service.impl;

import com.amazonaws.services.simpleemail.AmazonSimpleEmailService;
import com.amazonaws.services.simpleemail.model.Body;
import com.amazonaws.services.simpleemail.model.Content;
import com.amazonaws.services.simpleemail.model.Destination;
import com.amazonaws.services.simpleemail.model.Message;
import com.amazonaws.services.simpleemail.model.MessageRejectedException;
import com.amazonaws.services.simpleemail.model.SendEmailRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nl.centric.innovation.local4localEU.enums.AssetsEnum;
import nl.centric.innovation.local4localEU.enums.EmailHtmlEnum;
import nl.centric.innovation.local4localEU.enums.EmailStructureEnum;
import nl.centric.innovation.local4localEU.enums.EmailTemplateEnum;
import nl.centric.innovation.local4localEU.service.interfaces.MailTemplateBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.PropertySource;
import org.springframework.context.support.ResourceBundleMessageSource;
import org.springframework.stereotype.Service;
import util.MailTemplate;
import util.StringUtils;

import java.util.Locale;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@PropertySource({"classpath:application.properties"})
public class EmailService {
    @Value("${local4localEU.default.email.sender}")
    private String emailSender;

    @Value("${local4localEU.server.name}")
    private String baseURL;

    @Value("${taler.base.url}")
    private String talerBaseURL;

    @Value("${local4localEU.currencyManager.email}")
    private String currencyManagerEmail;

    private final ResourceBundleMessageSource messageSource;

    private final MailTemplateBuilder mailTemplateBuilder;

    private final AmazonSimpleEmailService amazonEmailService;

    public static final String UTF_8 = "UTF-8";
    public static final String i8N_FORMAT = "mail.%s.%s";

    public void sendEmail(String fromAddr, String[] toAddr, String subject, String htmlContent, String textContent) {
        log.info("Sending {} email to {}", subject);
        try {

            SendEmailRequest request = new SendEmailRequest().withDestination(new Destination().withToAddresses(toAddr))
                    .withMessage(new Message()
                            .withBody(new Body().withHtml(new Content().withCharset(UTF_8).withData(htmlContent))
                                    .withText(new Content().withCharset(UTF_8).withData(textContent)))
                            .withSubject(new Content().withCharset(UTF_8).withData(subject)))
                    .withSource(fromAddr);
            amazonEmailService.sendEmail(request);
        } catch (MessageRejectedException e) {
            log.error("Email could not be sent", e);
        }
    }

    private String buildTemplateText(MailTemplate mailTemplate) {
        StringBuffer textContentBuffer = new StringBuffer();
        textContentBuffer.append(mailTemplate.getTitle());
        textContentBuffer.append(EmailHtmlEnum.RN.getTag());
        textContentBuffer.append(mailTemplate.getContent());
        textContentBuffer.append(EmailHtmlEnum.RN.getTag());
        textContentBuffer.append(mailTemplate.getAction());
        textContentBuffer.append(EmailHtmlEnum.RN.getTag());
        textContentBuffer.append(mailTemplate.getUrl());
        textContentBuffer.append(EmailHtmlEnum.RN.getTag());
        textContentBuffer.append(mailTemplate.getClosing());
        return textContentBuffer.toString();
    }

    private MailTemplate buildGenericTemplate(Locale locale, String url, String templateMiddlePart,
                                              String receiverName) {
        String logoImage = baseURL + AssetsEnum.LOCAL_LOGO.getPath();
        String title = StringUtils.addStringBeforeAndAfter(EmailHtmlEnum.BOLD_START.getTag(),
                getEmailStringText(locale, templateMiddlePart, EmailStructureEnum.TITLE.getStructure(), receiverName),
                EmailHtmlEnum.BOLD_END.getTag());
        String subject = getEmailStringText(locale, templateMiddlePart, EmailStructureEnum.SUBJECT.getStructure());
        String action = getEmailStringText(locale, templateMiddlePart, EmailStructureEnum.ACTION.getStructure());
        String btnText = getEmailStringText(locale, EmailStructureEnum.GO_TO.getStructure(),
                EmailStructureEnum.BUTTON.getStructure());
        String closing = getEmailStringText(locale, EmailStructureEnum.GENERIC.getStructure(),
                EmailStructureEnum.CLOSING.getStructure());

        return MailTemplate.builder().locale(locale).logoImage(logoImage).title(title).url(url).subject(subject)
                .action(action).btnText(btnText).closing(closing).build();
    }

    public void sendPasswordRecoveryEmail(String url, String[] toAddress, String language) {
        MailTemplate mailTemplate = getPasswordRecoveryTemplate(language, url, EmailTemplateEnum.PASSWORD_RECOVER.getTemplate());
        String htmlContent = mailTemplateBuilder.buildEmailTemplate(mailTemplate);
        String textContent = buildTemplateText(mailTemplate);
        sendEmail(emailSender, toAddress, mailTemplate.getSubject(), htmlContent, textContent);
    }

    public void sendInviteMerchantEmail(String language, Map<String, UUID> toAddress, String message) {
        toAddress.forEach((email, uuid) -> {
            String url = String.format("%s/register/%s", baseURL, uuid);

            MailTemplate mailTemplate = getInviteMerchantTemplate(language, url,
                    EmailTemplateEnum.INVITE_MERCHANT.getTemplate(), message);

            sendEmail(emailSender,
                    new String[]{email},
                    mailTemplate.getSubject(),
                    mailTemplateBuilder.buildEmailTemplate(mailTemplate),
                    buildTemplateText(mailTemplate));
        });
    }

    public void sendMerchantRegisteredEmail(String url, String language, String merchantName, String[] managerEmails) {
        MailTemplate mailTemplate = getMerchantRegisteredTemplate(language, url, EmailTemplateEnum.MERCHANT_REGISTERED.getTemplate(), merchantName);
        String htmlContent = mailTemplateBuilder.buildEmailTemplate(mailTemplate);
        String textContent = buildTemplateText(mailTemplate);

        sendEmail(emailSender, managerEmails, mailTemplate.getSubject() + merchantName, htmlContent, textContent);
    }

    public void sendManagerOtpEmail(String language, String[] managerEmail, Integer otpCode) {
        MailTemplate mailTemplate = getManagerOtpEmailTemplate(language, EmailTemplateEnum.MANAGER_OTP.getTemplate(), otpCode);
        String htmlContent = mailTemplateBuilder.buildEmailTemplate(mailTemplate);
        String textContent = buildTemplateText(mailTemplate);
        sendEmail(emailSender, managerEmail, mailTemplate.getSubject(), htmlContent, textContent);

    }

    public void sendApproveMerchantEmail(String[] email, String language, String companyName, UUID token, String merchantName) {
        MailTemplate mailTemplate = getApproveMerchantTemplate(language, baseURL, EmailTemplateEnum.APPROVE_MERCHANT.getTemplate(),
                companyName + EmailHtmlEnum.EXCL.getTag(), token, merchantName);
        String htmlContent = mailTemplateBuilder.buildEmailTemplate(mailTemplate);
        String textContent = buildTemplateText(mailTemplate);
        sendEmail(emailSender, email, mailTemplate.getSubject(), htmlContent, textContent);
    }

    public void sendRejectMerchantEmail(String[] toAddress, String language, String companyName, String reason) {
        MailTemplate mailTemplate = getRejectMerchantTemplate(language, "", EmailTemplateEnum.REJECT_MERCHANT.getTemplate(), companyName + EmailHtmlEnum.EXCL.getTag(), reason);
        String htmlContent = mailTemplateBuilder.buildEmailTemplate(mailTemplate);
        String textContent = buildTemplateText(mailTemplate);
        sendEmail(emailSender, toAddress, mailTemplate.getSubject(), htmlContent, textContent);
    }

    private MailTemplate getManagerOtpEmailTemplate(String language, String templateMiddlePart, int otpCode) {
        Locale locale = Locale.forLanguageTag(language);
        MailTemplate mailTemplate = buildGenericTemplate(locale, "", templateMiddlePart, "");
        String content = getContentForManagerOtp(locale, templateMiddlePart, otpCode);
        mailTemplate.setContent(content);
        mailTemplate.setBtnText(null);

        return mailTemplate;
    }

    private MailTemplate getInviteMerchantTemplate(String language, String url, String templateMiddlePart, String message) {
        Locale locale = Locale.forLanguageTag(language);
        MailTemplate mailTemplate = buildGenericTemplate(locale, url, templateMiddlePart, "");

        String content = getContentForInviteMerchant(locale, templateMiddlePart, message);

        String closing = getEmailStringText(locale, EmailStructureEnum.GENERIC.getStructure(),
                EmailStructureEnum.CLOSING.getStructure());
        String btnText = getEmailStringText(locale, EmailStructureEnum.GENERIC.getStructure(),
                EmailStructureEnum.REGISTER_BTN.getStructure());

        mailTemplate.setClosing(closing);
        mailTemplate.setAction(null);
        mailTemplate.setBtnText(btnText);
        mailTemplate.setContent(content);

        return mailTemplate;
    }

    private MailTemplate getApproveMerchantTemplate(String language, String url, String templateMiddlePart,
                                                    String receiverName, UUID token, String merchantName) {
        Locale locale = Locale.forLanguageTag(language);
        MailTemplate mailTemplate = buildGenericTemplate(locale, url, templateMiddlePart, receiverName);

        String content = getContentForApproveMerchant(locale, templateMiddlePart, token, merchantName);

        mailTemplate.setAction(null);
        mailTemplate.setBtnText(null);
        mailTemplate.setContent(content);
        mailTemplate.setClosing(getEmailStringText(locale, EmailStructureEnum.GENERIC.getStructure(),
                EmailStructureEnum.CLOSING_JOIN.getStructure()));

        return mailTemplate;
    }

    private MailTemplate getRejectMerchantTemplate(String language, String url, String templateMiddlePart, String receiverName, String reason) {
        Locale locale = Locale.forLanguageTag(language);
        MailTemplate mailTemplate = buildGenericTemplate(locale, url, templateMiddlePart, receiverName);

        String fullReason = String.format("%s%s", reason, EmailHtmlEnum.END.getTag());
        String content = getContentForRejectMerchant(locale, templateMiddlePart, fullReason);

        mailTemplate.setContent(content);
        mailTemplate.setBtnText(null);
        String updatedAction = String.format("%s%s%s", mailTemplate.getAction(), currencyManagerEmail, EmailHtmlEnum.END.getTag());
        mailTemplate.setAction(updatedAction);

        return mailTemplate;
    }

    private MailTemplate getPasswordRecoveryTemplate(String language, String url, String templateMiddlePart) {
        Locale locale = Locale.forLanguageTag(language);
        MailTemplate mailTemplate = buildGenericTemplate(locale, url, templateMiddlePart, "");

        String content = getEmailStringText(locale, templateMiddlePart, EmailStructureEnum.CONTENT.getStructure()).replace(EmailHtmlEnum.LINE_BREAK.getTag(), EmailHtmlEnum.RN.getTag());
        mailTemplate.setContent(content);

        return mailTemplate;
    }

    private MailTemplate getMerchantRegisteredTemplate(String language, String url, String templateMiddlePart, String merchantName) {
        Locale locale = Locale.forLanguageTag(language);
        MailTemplate mailTemplate = buildGenericTemplate(locale, url, templateMiddlePart, "");

        String content = getContentForMerchantRegistered(locale, templateMiddlePart, merchantName);
        mailTemplate.setContent(content);

        return mailTemplate;
    }


    private String getContentForInviteMerchant(Locale locale, String templateMiddlePart, String message) {
        String contentInfo = getEmailStringText(locale, templateMiddlePart, EmailStructureEnum.CONTENT.getStructure())
                .replace(EmailHtmlEnum.LINE_BREAK.getTag(), EmailHtmlEnum.RN.getTag());
        String messageContent = StringUtils.addStringBeforeAndAfter(message, EmailHtmlEnum.END.getTag(), contentInfo);
        return StringUtils.joinStringPieces(messageContent, EmailHtmlEnum.LINE_BREAK.getTag(), EmailHtmlEnum.LINE_BREAK.getTag());
    }

    private String getContentForApproveMerchant(Locale locale, String templateMiddlePart, UUID token, String merchantName) {
        String contentInfo = getEmailStringText(locale, templateMiddlePart, EmailStructureEnum.CONTENT.getStructure()).replace(EmailHtmlEnum.LINE_BREAK.getTag(), EmailHtmlEnum.RN.getTag());

        String talerMessage = StringUtils.addStringBeforeAndAfter(EmailHtmlEnum.P_START.getTag(),
                getEmailStringText(locale, templateMiddlePart, EmailStructureEnum.TALER_MESSAGE.getStructure()), EmailHtmlEnum.P_END.getTag());

        String merchantTalerURL = talerBaseURL + merchantName.replace(" ", "-");
        String talerInstance = StringUtils.addStringBeforeAndAfter(getEmailStringText(locale, templateMiddlePart, EmailStructureEnum.TALER_INSTANCE.getStructure()),
                EmailHtmlEnum.getLinkTag(merchantTalerURL, merchantTalerURL), EmailHtmlEnum.LI_END.getTag());

        String talerAccessToken = StringUtils.addStringBeforeAndAfter(getEmailStringText(locale, templateMiddlePart, EmailStructureEnum.TALER_ACCESS_TOKEN.getStructure()),
                String.valueOf(token), EmailHtmlEnum.LI_END.getTag());

        String talerInstructions = StringUtils.addStringBeforeAndAfter(EmailHtmlEnum.LI_START.getTag(),
                getEmailStringText(locale, templateMiddlePart, EmailStructureEnum.TALER_INSTRUCTIONS.getStructure()), EmailHtmlEnum.LI_END.getTag());

        return StringUtils.joinStringPieces(contentInfo, EmailHtmlEnum.getLinkTag(baseURL, baseURL),
                EmailHtmlEnum.LINE_BREAK.getTag(), talerMessage, EmailHtmlEnum.LINE_BREAK.getTag(),
                EmailHtmlEnum.UL_START.getTag(), EmailHtmlEnum.LI_START.getTag(), talerInstance,
                EmailHtmlEnum.LI_START.getTag(), talerAccessToken, talerInstructions, EmailHtmlEnum.UL_END.getTag());
    }

    private String getContentForRejectMerchant(Locale locale, String templateMiddlePart, String reason) {
        String contentInfo = getEmailStringText(locale, templateMiddlePart, EmailStructureEnum.CONTENT.getStructure()).replace(EmailHtmlEnum.LINE_BREAK.getTag(), EmailHtmlEnum.RN.getTag());
        String rejectionText = StringUtils.addStringBeforeAndAfter(EmailHtmlEnum.P_START.getTag(), getEmailStringText(locale, templateMiddlePart, EmailStructureEnum.REASON.getStructure(), reason), EmailHtmlEnum.P_END.getTag());
        return StringUtils.joinStringPieces(contentInfo, rejectionText);
    }

    private String getContentForMerchantRegistered(Locale locale, String templateMiddlePart, String merchantName) {
        String contentInfo = getEmailStringText(locale, templateMiddlePart, EmailStructureEnum.CONTENT.getStructure()).replace(EmailHtmlEnum.LINE_BREAK.getTag(), EmailHtmlEnum.RN.getTag());
        String merchant = StringUtils.addStringBeforeAndAfter(EmailHtmlEnum.P_START.getTag(), getEmailStringText(locale, templateMiddlePart, EmailStructureEnum.COMPANY_NAME.getStructure(), merchantName), EmailHtmlEnum.P_END.getTag());
        return StringUtils.joinStringPieces(contentInfo, merchant);
    }

    private String getContentForManagerOtp(Locale locale, String templateMiddlePart, Integer otpCode) {
        String contentInfo = getEmailStringText(locale, templateMiddlePart, EmailStructureEnum.CONTENT.getStructure())
                .replace(EmailHtmlEnum.LINE_BREAK.getTag(), EmailHtmlEnum.RN.getTag());
        String otpCodeContent = StringUtils.addStringBeforeAndAfter(EmailHtmlEnum.H2_START.getTag(), otpCode.toString(), EmailHtmlEnum.H2_END.getTag());
        String otpBeforeContent = StringUtils.addStringBeforeAndAfter(EmailHtmlEnum.LINE_BREAK.getTag(),
                getEmailStringText(locale, templateMiddlePart, EmailStructureEnum.OTP_CODE_MESSAGE.getStructure()), EmailHtmlEnum.LINE_BREAK.getTag());

        return StringUtils.joinStringPieces(contentInfo, otpBeforeContent, otpCodeContent);


    }

    private String getEmailStringText(Locale locale, String templateMiddlePath, String emailPart) {
        return messageSource.getMessage(String.format(i8N_FORMAT, templateMiddlePath, emailPart), null, locale);
    }

    private String getEmailStringText(Locale locale, String templateMiddlePath, String emailPart, String variable) {
        return messageSource.getMessage(String.format(i8N_FORMAT, templateMiddlePath, emailPart), null, locale)
                + variable;
    }
}
