package nl.centric.innovation.local4localEU.repository;

import nl.centric.innovation.local4localEU.entity.Merchant;
import nl.centric.innovation.local4localEU.enums.MerchantStatusEnum;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MerchantRepository extends JpaRepository<Merchant, UUID> {
    Optional<Merchant> findByIdentifierNumber(String identifierNumber);

    Optional<Merchant> findByContactEmailIgnoreCase(String email);

    List<Merchant> findByStatus(MerchantStatusEnum merchantStatusEnum);

    List<Merchant> findByCategoryIdAndStatus(Integer categoryId, MerchantStatusEnum statusEnum);
}
