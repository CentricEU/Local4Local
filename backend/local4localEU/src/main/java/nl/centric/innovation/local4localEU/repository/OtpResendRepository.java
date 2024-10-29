package nl.centric.innovation.local4localEU.repository;

import nl.centric.innovation.local4localEU.entity.OtpResend;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface OtpResendRepository extends JpaRepository<OtpResend, Integer> {
    Optional<OtpResend> findTopBySessionIdOrderByCreatedDateDesc(UUID sessionId);
}
