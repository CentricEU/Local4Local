package nl.centric.innovation.local4localEU.dto;

import lombok.Builder;
import lombok.NonNull;
import nl.centric.innovation.local4localEU.entity.Category;
import nl.centric.innovation.local4localEU.entity.Merchant;
import nl.centric.innovation.local4localEU.enums.MerchantStatusEnum;

@Builder
public record MerchantDto(
        @NonNull String companyName,
        @NonNull String identifierNumber,
        @NonNull Integer category,
        @NonNull Double latitude,
        @NonNull Double longitude,
        @NonNull String address,
        @NonNull String contactEmail,
        String website
) {

    public static Merchant toEntity(MerchantDto createMerchantDto) {
        return Merchant.builder()
                .companyName(createMerchantDto.companyName())
                .identifierNumber(createMerchantDto.identifierNumber())
                .category(Category.builder().id(createMerchantDto.category).build())
                .lat(createMerchantDto.latitude)
                .lon(createMerchantDto.longitude)
                .website(createMerchantDto.website())
                .address(createMerchantDto.address)
                .contactEmail(createMerchantDto.contactEmail)
                .status(MerchantStatusEnum.PENDING)
                .build();
    }

}
