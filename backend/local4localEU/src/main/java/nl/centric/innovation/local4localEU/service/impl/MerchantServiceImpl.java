package nl.centric.innovation.local4localEU.service.impl;

import static nl.centric.innovation.local4localEU.dto.MerchantDto.toEntity;
import static util.Validators.isValidUrl;

import java.io.IOException;
import java.net.URISyntaxException;
import java.util.EnumSet;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

import nl.centric.innovation.local4localEU.dto.RejectMerchantDto;
import nl.centric.innovation.local4localEU.entity.RejectMerchant;
import nl.centric.innovation.local4localEU.entity.User;
import nl.centric.innovation.local4localEU.enums.MerchantStatusEnum;
import nl.centric.innovation.local4localEU.exception.CustomException.TalerException;
import nl.centric.innovation.local4localEU.exception.CustomException.DtoValidateNotFoundException;
import nl.centric.innovation.local4localEU.repository.RejectMerchantRepository;
import nl.centric.innovation.local4localEU.repository.UserRepository;
import nl.centric.innovation.local4localEU.service.interfaces.EmailService;
import nl.centric.innovation.local4localEU.service.interfaces.TalerService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.PropertySource;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import lombok.RequiredArgsConstructor;
import nl.centric.innovation.local4localEU.dto.MerchantDto;
import nl.centric.innovation.local4localEU.dto.MerchantViewDto;
import nl.centric.innovation.local4localEU.entity.Merchant;
import nl.centric.innovation.local4localEU.exception.CustomException.DtoValidateAlreadyExistsException;
import nl.centric.innovation.local4localEU.exception.CustomException.DtoValidateException;
import nl.centric.innovation.local4localEU.repository.MerchantRepository;
import nl.centric.innovation.local4localEU.service.interfaces.MerchantService;

@Service
@RequiredArgsConstructor
@PropertySource({"classpath:errorcodes.properties"})
public class MerchantServiceImpl implements MerchantService {

    private final MerchantRepository merchantRepository;

    private final EmailService emailService;

    private final TalerService talerService;

    private final RejectMerchantRepository rejectMerchantRepository;

    private final UserRepository userRepository;

    @Value("${error.unique.violation}")
    private String errorUniqueViolation;

    @Value("${error.unique.email}")
    private String errorUniqueEmail;

    @Value("${error.general.entityValidate}")
    private String errorEntityValidate;

    @Value("${error.entity.notfound}")
    private String errorEntityNotFound;

    @Value("${error.constraint.duplicate}")
    private String duplicateValue;

    @Value("${error.entity.redundantChange}")
    private String redundantChange;

    @Value("${local4localEU.currencyManager.email}")
    private String currencyManagerEmail;

    @Override
    public void approveMerchant(UUID merchantId, String language) throws DtoValidateException, URISyntaxException,
            IOException, InterruptedException, TalerException {
        Optional<Merchant> merchant = merchantRepository.findById(merchantId);

        if (merchant.isEmpty()) {
            throw new DtoValidateNotFoundException(errorEntityNotFound);
        }

        if (merchant.get().getStatus() == MerchantStatusEnum.APPROVED) {
            throw new DtoValidateAlreadyExistsException(redundantChange);
        }

        merchant.get().setStatus(MerchantStatusEnum.APPROVED);
        merchantRepository.save(merchant.get());

        UUID token = talerService.createTallerInstance(merchant.get().getCompanyName());
        String[] email = new String[]{merchant.get().getContactEmail()};
        emailService.sendApproveMerchantEmail(email, language, merchant.get().getCompanyName(), token, merchant.get().getCompanyName());
    }

    @Override
    public void rejectMerchant(RejectMerchantDto merchantDto, String language)
            throws DtoValidateException, DataIntegrityViolationException {

        Optional<Merchant> merchant = merchantRepository.findById(merchantDto.merchantId());

        if (merchant.isEmpty()) {
            throw new DtoValidateNotFoundException(errorEntityNotFound);
        }

        EnumSet<MerchantStatusEnum> invalidStatuses = EnumSet.of(MerchantStatusEnum.REJECTED, MerchantStatusEnum.APPROVED);

        if (invalidStatuses.contains(merchant.get().getStatus())) {
            throw new DtoValidateAlreadyExistsException(redundantChange);
        }

        Optional<User> user = userRepository.findByEmailIgnoreCase(currencyManagerEmail);

        if (user.isEmpty()) {
            throw new DtoValidateNotFoundException(errorEntityNotFound);
        }

        RejectMerchant rejectMerchant = RejectMerchantDto.toEntity(merchantDto, merchant.get());

        rejectMerchantRepository.save(rejectMerchant);

        merchant.get().setStatus(MerchantStatusEnum.REJECTED);
        merchantRepository.save(merchant.get());

        String[] email = new String[]{merchant.get().getContactEmail()};
        emailService.sendRejectMerchantEmail(email, language, merchant.get().getCompanyName(), merchantDto.reason());
    }

    @Override
    public MerchantDto saveMerchant(MerchantDto merchantDto) throws DtoValidateException {
        validateMerchantDto(merchantDto);
        merchantRepository.save(toEntity(merchantDto));

        return merchantDto;
    }

    @Override
    public List<MerchantViewDto> getAllApproved() {
        return merchantRepository.findByStatus(MerchantStatusEnum.APPROVED).stream()
                .map(MerchantViewDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    public List<MerchantViewDto> getPaginatedMerchants(Integer page, Integer size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(
                Sort.Order.asc("status"),
                Sort.Order.asc("createdDate")
        ));

        Page<Merchant> merchants = merchantRepository.findAll(pageable);

        return merchants.stream()
                .map(MerchantViewDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    public List<MerchantViewDto> getByCategory(Integer categoryId) {
        boolean isValidCategory = categoryId != null && categoryId >= 0 && categoryId <= 8;

        List<Merchant> merchants = isValidCategory
                ? merchantRepository.findByCategoryIdAndStatus(categoryId, MerchantStatusEnum.APPROVED)
                : merchantRepository.findByStatus(MerchantStatusEnum.APPROVED);

        return merchants.stream()
                .map(MerchantViewDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    public Long countAll() {
        return merchantRepository.count();
    }

    private void validateMerchantDto(MerchantDto merchantDto) throws DtoValidateException {
        Optional<Merchant> existingMerchant = merchantRepository.findByIdentifierNumber(merchantDto.identifierNumber());

        if (existingMerchant.isPresent()) {
            throw new DtoValidateAlreadyExistsException(errorUniqueViolation);
        }

        Optional<Merchant> existingMerchantByEmail = merchantRepository.findByContactEmailIgnoreCase(merchantDto.contactEmail());

        if (existingMerchantByEmail.isPresent()) {
            throw new DtoValidateAlreadyExistsException(errorUniqueEmail);
        }

        if (merchantDto.category() < 0 || merchantDto.category() > 8) {
            throw new DtoValidateException(errorEntityValidate);
        }

        if (merchantDto.website() != null && !merchantDto.website().isEmpty() && !isValidUrl(merchantDto.website())) {
            throw new DtoValidateException(errorEntityValidate);
        }
    }

}
