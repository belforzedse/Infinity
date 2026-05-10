// Error message translations from backend (English) to Persian
export const ERROR_MESSAGE_MAP: Record<string, string> = {
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
  unauthorized: "احراز هویت ناموفق بود. دوباره تلاش کنید.",
  "something went wrong": "متأسفانه مشکلی پیش آمد. دوباره تلاش کنید.",
  "please try again": "دوباره تلاش کنید.",
  "try again": "دوباره تلاش کنید.",
  "this attribute must be unique": "این نام قبلاً استفاده شده است. لطفاً نام متفاوتی انتخاب کنید.",
  "attribute must be unique": "این نام قبلاً استفاده شده است. لطفاً نام متفاوتی انتخاب کنید.",
  "must be unique": "این نام قبلاً استفاده شده است. لطفاً نام متفاوتی انتخاب کنید.",
  "attribute title must be unique": "این عنوان قبلاً استفاده شده است. لطفاً عنوان متفاوتی انتخاب کنید.",
  "title must be unique": "این عنوان قبلاً استفاده شده است. لطفاً عنوان متفاوتی انتخاب کنید.",
  "missing field": "اطلاعات کافی ارسال نشده است. لطفاً تمام فیلدهای الزامی را پر کنید.",
  "invalid request": "درخواست نامعتبر است. لطفاً دوباره تلاش کنید.",
  forbidden: "شما مجاز به انجام این عمل نیستید.",
  "not found": "موردی یافت نشد.",
  "server error": "خطای سرور. لطفاً بعداً دوباره تلاش کنید.",
  "too many requests": "تعداد درخواست‌ها بیش از حد است. لطفاً چند لحظه بعد دوباره تلاش کنید.",
  "story not found": "استوری یافت نشد.",
  "story id is required": "شناسه استوری الزامی است.",
  "invalid story id": "شناسه استوری معتبر نیست.",
  "error fetching active stories": "خطا در دریافت استوری‌ها. دوباره تلاش کنید.",
  "error marking story seen": "خطا در ثبت مشاهده استوری. دوباره تلاش کنید.",
  "authentication required to mark story": "برای ثبت مشاهده باید وارد حساب کاربری خود شوید.",
};

export const translateErrorMessage = (
  errorMessage: string,
  defaultMessage: string = "متأسفانه مشکلی پیش آمد. دوباره تلاش کنید.",
): string => {
  if (!errorMessage) return defaultMessage;

  const lowerMessage = errorMessage.toLowerCase();

  for (const [key, value] of Object.entries(ERROR_MESSAGE_MAP)) {
    if (lowerMessage.includes(key.toLowerCase())) {
      return value;
    }
  }

  if (/[\u0600-\u06FF]/.test(errorMessage)) {
    return errorMessage;
  }

  return defaultMessage;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Supports `@repo/api` ApiError, Strapi shapes, and legacy axios-like `response`. */
export const extractErrorMessage = (error: unknown): string => {
  if (isRecord(error) && typeof error.message === "string" && error.message.length > 0) {
    return error.message;
  }

  if (!isRecord(error)) {
    return "";
  }

  const response = error.response;
  if (isRecord(response)) {
    const data = response.data;
    if (isRecord(data)) {
      const err = data.error;
      if (isRecord(err)) {
        const details = err.details;
        if (isRecord(details)) {
          const validationErrors = details.errors;
          if (Array.isArray(validationErrors) && validationErrors.length > 0) {
            const first = validationErrors[0];
            if (isRecord(first) && typeof first.message === "string") {
              return first.message;
            }
          }
        }
        if (typeof err.message === "string") {
          return err.message;
        }
      }
      if (typeof data.message === "string") {
        return data.message;
      }
    }
  }

  return "";
};
