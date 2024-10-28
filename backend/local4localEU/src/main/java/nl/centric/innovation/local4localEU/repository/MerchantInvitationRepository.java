package nl.centric.innovation.local4localEU.repository;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import nl.centric.innovation.local4localEU.entity.MerchantInvitation;

public interface MerchantInvitationRepository extends JpaRepository<MerchantInvitation, UUID> {
    Page<MerchantInvitation> findAllByIsActiveTrueOrderByCreatedDateDesc(Pageable pageable);    Integer countByIsActiveTrue();
}
