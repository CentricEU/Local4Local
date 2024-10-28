package nl.centric.innovation.local4localEU.service.interfaces;

import nl.centric.innovation.local4localEU.dto.InvitationDto;
import nl.centric.innovation.local4localEU.dto.InviteMerchantDto;
import nl.centric.innovation.local4localEU.exception.CustomException.DtoValidateException;

import java.util.List;

public interface MerchantInvitationService {
	void save(InviteMerchantDto inviteSupplierDto, String language) throws DtoValidateException;

    List<InvitationDto> getAllLatestSentToEmail(Integer page, Integer size) throws DtoValidateException;

    Integer countInvitations();
}
