package nl.centric.innovation.local4localEU.dto;

import lombok.Builder;
import nl.centric.innovation.local4localEU.entity.MerchantInvitation;

import java.time.LocalDateTime;

@Builder
public record InvitationDto(
        LocalDateTime createdDate,
        String email
) {

    public static InvitationDto toDto(MerchantInvitation invitation) {
        return InvitationDto.builder()
                .email(invitation.getEmail())
                .createdDate(invitation.getCreatedDate())
                .build();
    }
}
