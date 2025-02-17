package nl.centric.innovation.local4localEU.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Builder;

import java.util.List;

@Builder
public record InviteMerchantDto(
        @NotEmpty(message = "At least one email is mandatory")
        List<String> emails,
        @NotNull(message = "Message is mandatory")
        String message) {
}