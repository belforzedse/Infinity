// Error message translations from backend (English) to Persian
// All user-facing errors should be Persian; this map catches any stray English.
export const ERROR_MESSAGE_MAP: Record<string, string> = {
  // OTP / auth errors (fallback if backend ever returns English)
  "otp or otptoken is invalid": "کد وارد شده نامعتبر یا منقضی شده است. دوباره تلاش کنید.",
  "otptoken is invalid or expired": "کد وارد شده نامعتبر یا منقضی شده است. دوباره تلاش کنید.",
  "otptoken is invalid": "کد وارد شده نامعتبر یا منقضی شده است. دوباره تلاش کنید.",
  "otp is invalid": "کد وارد شده نامعتبر یا منقضی شده است. دوباره تلاش کنید.",
  "invalid otp": "کد وارد شده نامعتبر یا منقضی شده است. دوباره تلاش کنید.",
  "login failed": "ورود ناموفق بود. دوباره تلاش کنید.",
  "phone is required": "شماره همراه الزامی است.",
  "phone is invalid": "شماره همراه معتبر نیست. دوباره تلاش کنید.",
  "phone and password are required": "شماره همراه و رمز عبور الزامی است.",
  "user not found or password is incorrect": "شماره همراه یا رمز عبور اشتباه است.",
  "unauthorized": "احراز هویت ناموفق بود. دوباره تلاش کنید.",
  "something went wrong": "متأسفانه مشکلی پیش آمد. دوباره تلاش کنید.",
  "please try again": "دوباره تلاش کنید.",
  "try again": "دوباره تلاش کنید.",

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

  // Authorization errors (unauthorized above in OTP section)
  "forbidden": "شما مجاز به انجام این عمل نیستید.",

  // Not found errors
  "not found": "موردی یافت نشد.",

  // Server errors
  "server error": "خطای سرور. لطفاً بعداً دوباره تلاش کنید.",
  "too many requests": "تعداد درخواست‌ها بیش از حد است. لطفاً چند لحظه بعد دوباره تلاش کنید.",
};

/**
 * Translates backend error messages to Persian
 * @param errorMessage - The error message from the backend (usually in English)
 * @param defaultMessage - Optional custom fallback message (in Persian)
 * @returns Persian error message
 */
export const translateErrorMessage = (
  errorMessage: string,
  defaultMessage: string = "متأسفانه مشکلی پیش آمد. دوباره تلاش کنید.",
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
