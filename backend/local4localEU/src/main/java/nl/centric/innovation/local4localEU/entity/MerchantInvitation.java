package nl.centric.innovation.local4localEU.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@EqualsAndHashCode(callSuper = true)
@Entity
@Table(schema = "l4l_eu_global", name = "merchant_invitation")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class MerchantInvitation extends BaseEntity {

    @Column(name = "email")
    private String email;

    @Column(name = "message")
    private String message;

    @Column(name = "is_active")
    private boolean isActive;

    @Column(name = "is_registered")
    private Boolean isRegistered;

    @Column(name = "token")
    private UUID token;

    @Column(name = "token_expiration_date")
    private LocalDateTime tokenExpirationDate;

    public static MerchantInvitation of(String email, String message) {
        LocalDateTime tokenExpirationDate = LocalDateTime.now().plusDays(2);

        return MerchantInvitation.builder()
                .email(email)
                .message(message)
                .isActive(true)
                .isRegistered(false)
                .token(UUID.randomUUID())
                .tokenExpirationDate(tokenExpirationDate)
                .build();
    }
}
