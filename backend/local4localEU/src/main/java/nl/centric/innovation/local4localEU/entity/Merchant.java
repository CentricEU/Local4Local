package nl.centric.innovation.local4localEU.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Enumerated;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import nl.centric.innovation.local4localEU.enums.MerchantStatusEnum;
import org.hibernate.annotations.JdbcType;
import org.hibernate.dialect.PostgreSQLEnumJdbcType;

import java.io.Serial;

@EqualsAndHashCode(callSuper = true)
@Entity
@Table(schema = "l4l_eu_security", name = "merchant")
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Merchant extends BaseEntity {

    @Serial
    private static final long serialVersionUID = 1L;

    @Column(name = "company_name", nullable = false)
    private String companyName;

    @Column(name = "identifier_number", nullable = false)
    private String identifierNumber;

    @ManyToOne
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(name = "lat", nullable = false)
    private Double lat;

    @Column(name = "lon", nullable = false)
    private Double lon;

    @Column(name = "address", nullable = false)
    private String address;

    @Column(name = "contact_email", nullable = false, unique = true)
    private String contactEmail;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "status")
    @JdbcType(PostgreSQLEnumJdbcType.class)
    private MerchantStatusEnum status;

    @Column(name = "website")
    private String website;

    @OneToOne(mappedBy = "merchant", cascade = CascadeType.REMOVE, orphanRemoval = true)
    private RejectMerchant rejectMerchant;
}
