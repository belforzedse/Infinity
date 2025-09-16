type Props = {
  count: number;
  isRecycleBinOpen?: boolean;
  setIsRecycleBinOpen?: (isRecycleBinOpen: boolean) => void;
  hasError?: boolean;
};

export default function SuperAdminLayoutContentWrapperButtonRecycleBin({
  count,
  isRecycleBinOpen,
  setIsRecycleBinOpen,
  hasError,
}: Props) {
  return (
    <span
      className="text-sm cursor-pointer"
      onClick={() => setIsRecycleBinOpen?.(!isRecycleBinOpen)}
    >
      <span className="text-foreground-primary">
        {isRecycleBinOpen ? "مشاهده جدید" : "مشاهده زباله‌دان"}
      </span>
      {!isRecycleBinOpen && (
        <span className="text-foreground-muted">
          (
          {hasError ? (
            <span className="text-red-500" title="خطا در دریافت تعداد">
              !
            </span>
          ) : (
            count
          )}
          )
        </span>
      )}
    </span>
  );
}
