// tmp.service.js

import { tempResponseDTO } from "../dtos/tmp.response.dto";

export const getTempData = () => {
    return tempResponseDTO("This is TEST! >.0");
}