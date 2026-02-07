const MILLISECONDS_IN_DAY = 24 * 60 * 60 * 1000;
const PERSIAN_LOCALE = "fa-IR-u-ca-persian";

const toDate = (value: Date | string) => {
  if (value instanceof Date) return value;
  return new Date(value);
};

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const formatFaRelativeDateTime = (
  value?: Date | string | null,
) => {
  if (!value) return "-";

  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return "-";

  const now = new Date();
  const diffDays = Math.floor(
    (startOfDay(now).getTime() - startOfDay(date).getTime()) / MILLISECONDS_IN_DAY,
  );

  const timeText = new Intl.DateTimeFormat("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  if (diffDays === 0) {
    return `امروز ساعت ${timeText}`;
  }

  if (diffDays === 1) {
    return `دیروز ساعت ${timeText}`;
  }

  if (diffDays >= 2 && diffDays < 7) {
    const weekdayText = new Intl.DateTimeFormat(PERSIAN_LOCALE, {
      weekday: "long",
    }).format(date);
    return `${weekdayText} ساعت ${timeText}`;
  }

  const currentPersianYear = new Intl.DateTimeFormat(PERSIAN_LOCALE, {
    year: "numeric",
  }).format(now);
  const targetPersianYear = new Intl.DateTimeFormat(PERSIAN_LOCALE, {
    year: "numeric",
  }).format(date);

  if (targetPersianYear === currentPersianYear) {
    const dayMonthText = new Intl.DateTimeFormat(PERSIAN_LOCALE, {
      day: "numeric",
      month: "long",
    }).format(date);
    return `${dayMonthText} ساعت ${timeText}`;
  }

  const fullDateText = new Intl.DateTimeFormat(PERSIAN_LOCALE, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
  return `${fullDateText} ساعت ${timeText}`;
};
