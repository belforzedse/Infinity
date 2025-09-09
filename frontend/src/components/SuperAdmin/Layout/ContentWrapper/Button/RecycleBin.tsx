type Props = {
  count: number;
  isRecycleBinOpen?: boolean;
  setIsRecycleBinOpen?: (isRecycleBinOpen: boolean) => void;
};

export default function SuperAdminLayoutContentWrapperButtonRecycleBin({
  count,
  isRecycleBinOpen,
  setIsRecycleBinOpen,
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
        <span className="text-foreground-muted">({count})</span>
      )}
    </span>
  );
}
