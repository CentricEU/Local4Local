import { API_PATH } from "@/constants/api";
import ChipData from "@/models/chip-data";

export default class CategoryService {
	static async getCategories(): Promise<ChipData[]> {
		try {
			const response = await fetch(`${API_PATH}/public/category/all`);

			if (!response.ok) {
				throw Error(response.status.toString());
			}

			return await response.json();
		} catch (error) {
			throw error;
		}
	}
}