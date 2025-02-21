import { API_PATH } from "@/constants/api";
import MerchantDto from "@/models/merchant-view-dto";

export default class MerchantService {
	static async getMerchantsByCategoryId(categoryId: number): Promise<MerchantDto[]> {
		try {
			const response = await fetch(`${API_PATH}/merchant/public/filter/${categoryId}`);

			if (!response.ok) {
				throw Error(response.status.toString());
			}

			return await response.json();
		} catch (error) {
			throw error;
		}
	}
}