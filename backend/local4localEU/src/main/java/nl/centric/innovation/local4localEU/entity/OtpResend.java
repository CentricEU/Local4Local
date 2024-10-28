package nl.centric.innovation.local4localEU.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.util.UUID;

@EqualsAndHashCode(callSuper = true)
@Entity
@Table(schema = "l4l_eu_security", name = "otp_resend")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class OtpResend extends BaseEntity {

    @Column(name = "session_id", nullable = false)
    private UUID sessionId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    public static OtpResend of(UUID sessionId, UUID userId) {
        return OtpResend.builder()
                .sessionId(sessionId)
                .userId(userId)
                .build();
    }
}
