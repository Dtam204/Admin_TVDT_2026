/**
 * Utility functions for date parsing and formatting
 * Xử lý date đúng cách để tránh timezone issues
 */

/**
 * Parse date string đúng cách, tránh timezone issues
 * Lấy phần date (YYYY-MM-DD) từ date string và tạo Date object từ UTC
 * 
 * @param dateString - Date string từ backend (format: YYYY-MM-DD hoặc YYYY-MM-DDTHH:mm:ss.sssZ)
 * @returns Date object được tạo từ UTC để tránh timezone conversion
 * 
 * @example
 * parseDate("2024-01-05T00:00:00.000Z") // Returns Date for 2024-01-05
 * parseDate("2024-01-05") // Returns Date for 2024-01-05
 */
export const parseDate = (dateString: string): Date => {
    if (!dateString) {
        return new Date();
    }

    // Nếu date string có format YYYY-MM-DD hoặc YYYY-MM-DDTHH:mm:ss.sssZ
    // Chỉ lấy phần date (YYYY-MM-DD) để tránh timezone conversion
    const dateOnly = dateString.split("T")[0]; // Lấy phần trước "T"
    const [year, month, day] = dateOnly.split("-").map(Number);

    // Tạo Date object từ UTC để tránh timezone conversion
    // month - 1 vì Date.UTC dùng 0-based month (0 = January, 11 = December)
    return new Date(Date.UTC(year, month - 1, day));
};

/**
 * Format date sang định dạng tiếng Việt
 * Format trực tiếp từ date string để tránh timezone issues
 * 
 * @param dateString - Date string từ backend
 * @returns Formatted date string theo định dạng tiếng Việt
 * 
 * @example
 * formatDateVN("2024-01-05T00:00:00.000Z") // Returns "05 tháng 1, 2024"
 * formatDateVN("2024-01-05") // Returns "05 tháng 1, 2024"
 */
export const formatDateVN = (dateString: string): string => {
    if (!dateString) {
        return "";
    }

    // Lấy phần date (YYYY-MM-DD) từ date string
    const dateOnly = dateString.split("T")[0];
    const [year, month, day] = dateOnly.split("-").map(Number);

    // Format trực tiếp từ date string, không qua Date object để tránh timezone issues
    const monthNames = [
        "tháng 1", "tháng 2", "tháng 3", "tháng 4", "tháng 5", "tháng 6",
        "tháng 7", "tháng 8", "tháng 9", "tháng 10", "tháng 11", "tháng 12"
    ];

    return `${day.toString().padStart(2, "0")} ${monthNames[month - 1]}, ${year}`;
};

/**
 * Format date sang định dạng YYYY-MM-DD cho input type="date"
 * 
 * @param dateString - Date string từ backend
 * @returns Date string theo format YYYY-MM-DD
 * 
 * @example
 * formatDateForInput("2024-01-05T00:00:00.000Z") // Returns "2024-01-05"
 * formatDateForInput("2024-01-05") // Returns "2024-01-05"
 */
export const formatDateForInput = (dateString: string): string => {
    if (!dateString) {
        return "";
    }
    // Lấy phần date (YYYY-MM-DD) từ date string
    const dateOnly = dateString.split("T")[0];
    return dateOnly;
};

/**
 * Chuyển đổi tiếng Việt có dấu sang slug không dấu
 * 
 * @param text - Text cần chuyển đổi
 * @returns Slug không dấu, lowercase, cách nhau bằng dấu gạch ngang
 * 
 * @example
 * generateSlug("Tiêu đề bài viết") // Returns "tieu-de-bai-viet"
 * generateSlug("Sản phẩm & Giải pháp") // Returns "san-pham-giai-phap"
 */
export const generateSlug = (text: string): string => {
    if (!text) return "";
    
    // Map các ký tự tiếng Việt sang không dấu
    const vietnameseMap: { [key: string]: string } = {
        à: 'a', á: 'a', ạ: 'a', ả: 'a', ã: 'a',
        â: 'a', ầ: 'a', ấ: 'a', ậ: 'a', ẩ: 'a', ẫ: 'a',
        ă: 'a', ằ: 'a', ắ: 'a', ặ: 'a', ẳ: 'a', ẵ: 'a',
        è: 'e', é: 'e', ẹ: 'e', ẻ: 'e', ẽ: 'e',
        ê: 'e', ề: 'e', ế: 'e', ệ: 'e', ể: 'e', ễ: 'e',
        ì: 'i', í: 'i', ị: 'i', ỉ: 'i', ĩ: 'i',
        ò: 'o', ó: 'o', ọ: 'o', ỏ: 'o', õ: 'o',
        ô: 'o', ồ: 'o', ố: 'o', ộ: 'o', ổ: 'o', ỗ: 'o',
        ơ: 'o', ờ: 'o', ớ: 'o', ợ: 'o', ở: 'o', ỡ: 'o',
        ù: 'u', ú: 'u', ụ: 'u', ủ: 'u', ũ: 'u',
        ư: 'u', ừ: 'u', ứ: 'u', ự: 'u', ử: 'u', ữ: 'u',
        ỳ: 'y', ý: 'y', ỵ: 'y', ỷ: 'y', ỹ: 'y',
        đ: 'd',
        À: 'A', Á: 'A', Ạ: 'A', Ả: 'A', Ã: 'A',
        Â: 'A', Ầ: 'A', Ấ: 'A', Ậ: 'A', Ẩ: 'A', Ẫ: 'A',
        Ă: 'A', Ằ: 'A', Ắ: 'A', Ặ: 'A', Ẳ: 'A', Ẵ: 'A',
        È: 'E', É: 'E', Ẹ: 'E', Ẻ: 'E', Ẽ: 'E',
        Ê: 'E', Ề: 'E', Ế: 'E', Ệ: 'E', Ể: 'E', Ễ: 'E',
        Ì: 'I', Í: 'I', Ị: 'I', Ỉ: 'I', Ĩ: 'I',
        Ò: 'O', Ó: 'O', Ọ: 'O', Ỏ: 'O', Õ: 'O',
        Ô: 'O', Ồ: 'O', Ố: 'O', Ộ: 'O', Ổ: 'O', Ỗ: 'O',
        Ơ: 'O', Ờ: 'O', Ớ: 'O', Ợ: 'O', Ở: 'O', Ỡ: 'O',
        Ù: 'U', Ú: 'U', Ụ: 'U', Ủ: 'U', Ũ: 'U',
        Ư: 'U', Ừ: 'U', Ứ: 'U', Ự: 'U', Ử: 'U', Ữ: 'U',
        Ỳ: 'Y', Ý: 'Y', Ỵ: 'Y', Ỷ: 'Y', Ỹ: 'Y',
        Đ: 'D',
    };

    return text
        .split('')
        .map(char => vietnameseMap[char] || char)
        .join('')
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Loại bỏ ký tự đặc biệt
        .replace(/\s+/g, '-') // Thay khoảng trắng bằng dấu gạch ngang
        .replace(/-+/g, '-') // Loại bỏ nhiều dấu gạch ngang liên tiếp
        .replace(/^-+|-+$/g, ''); // Loại bỏ dấu gạch ngang ở đầu và cuối
};

