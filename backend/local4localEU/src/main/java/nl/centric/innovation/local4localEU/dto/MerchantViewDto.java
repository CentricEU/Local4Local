package nl.centric.innovation.local4localEU.dto;

import lombok.Builder;
import lombok.NonNull;
import nl.centric.innovation.local4localEU.entity.Merchant;
import nl.centric.innovation.local4localEU.enums.MerchantStatusEnum;

import java.util.UUID;

@Builder
public record MerchantViewDto(
        @NonNull UUID id,
        @NonNull String companyName,
        @NonNull String identifierNumber,
        @NonNull String category,
        @NonNull Double latitude,
        @NonNull Double longitude,
        @NonNull String address,
        @NonNull String contactEmail,
        @NonNull MerchantStatusEnum status,
        String website
) {
    public static MerchantViewDto fromEntity(Merchant merchant) {
        return MerchantViewDto.builder()
                .id(merchant.getId())
                .companyName(merchant.getCompanyName())
                .identifierNumber(merchant.getIdentifierNumber())
                .category(merchant.getCategory().getLabel())
                .website(merchant.getWebsite())
                .address(merchant.getAddress())
                .contactEmail(merchant.getContactEmail())
                .status(merchant.getStatus())
                .latitude(merchant.getLat())
                .longitude(merchant.getLon())
                .build();
    }

}
