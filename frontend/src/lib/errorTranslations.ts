// Error message translations from backend (English) to Persian
export const ERROR_MESSAGE_MAP: Record<string, string> = {
  // Uniqueness errors
  "this attribute must be unique": "این نام قبلاً استفاده شده است. لطفاً نام متفاوتی انتخاب کنید.",
  "attribute must be unique": "این نام قبلاً استفاده شده است. لطفاً نام متفاوتی انتخاب کنید.",
  "must be unique": "این نام قبلاً استفاده شده است. لطفاً نام متفاوتی انتخاب کنید.",
  "attribute title must be unique": "این عنوان قبلاً استفاده شده است. لطفاً عنوان متفاوتی انتخاب کنید.",
  "title must be unique": "این عنوان قبلاً استفاده شده است. لطفاً عنوان متفاوتی انتخاب کنید.",
  "attribute colorcode must be unique": "این کد رنگ قبلاً استفاده شده است. لطفاً کد رنگ متفاوتی انتخاب کنید.",
  "colorcode must be unique": "این کد رنگ قبلاً استفاده شده است. لطفاً کد رنگ متفاوتی انتخاب کنید.",

  // Validation errors
  "missing field": "اطلاعات کافی ارسال نشده است. لطفاً تمام فیلدهای الزامی را پر کنید.",
  "invalid request": "درخواست نامعتبر است. لطفاً دوباره تلاش کنید.",
  "invalid color code": "کد رنگ نامعتبر است. لطفاً کد رنگ صحیح را وارد کنید.",

  // Authorization errors
  "unauthorized": "شما مجاز به انجام این عمل نیستید.",
  "forbidden": "شما مجاز به انجام این عمل نیستید.",

  // Not found errors
  "not found": "موردی یافت نشد.",

  // Server errors
  "server error": "خطای سرور. لطفاً بعداً دوباره تلاش کنید.",
};

/**
 * Translates backend error messages to Persian
 * @param errorMessage - The error message from the backend (usually in English)
 * @param defaultMessage - Optional custom fallback message (in Persian)
 * @returns Persian error message
 */
export const translateErrorMessage = (
  errorMessage: string,
  defaultMessage: string = "خطا در ایجاد ویژگی جدید. لطفاً دوباره تلاش کنید.",
): string => {
  if (!errorMessage) return defaultMessage;

  const lowerMessage = errorMessage.toLowerCase();

  // Check for matches in the translation map
  for (const [key, value] of Object.entries(ERROR_MESSAGE_MAP)) {
    if (lowerMessage.includes(key.toLowerCase())) {
      return value;
    }
  }

  // If no match found, return the original message if it's already Persian, otherwise use default
  if (/[\u0600-\u06FF]/.test(errorMessage)) {
    return errorMessage;
  }

  return defaultMessage;
};

/**
 * Extracts error message from various API response formats
 * Handles Strapi validation errors and standard error responses
 * @param error - The error object from API call
 * @returns Raw error message string
 */
export const extractErrorMessage = (error: any): string => {
  // Try Strapi validation error format first
  const validationErrors = error?.response?.data?.error?.details?.errors;
  if (validationErrors && Array.isArray(validationErrors) && validationErrors.length > 0) {
    return validationErrors[0].message || "";
  }

  // Try other common error formats
  return (
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    error?.response?.data?.errors?.[0]?.message ||
    error?.message ||
    ""
  );
};
