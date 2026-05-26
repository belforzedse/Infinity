import React from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

export type UploadStatus = "idle" | "uploading" | "uploaded" | "failed";

const STATUS_LABELS: Record<Exclude<UploadStatus, "idle">, string> = {
  uploading: "در حال آپلود",
  uploaded: "آپلود شد",
  failed: "آپلود ناموفق",
};

const STATUS_STYLES: Record<Exclude<UploadStatus, "idle">, string> = {
  uploading: "bg-amber-50 text-amber-700 ring-amber-200",
  uploaded: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  failed: "bg-rose-50 text-rose-700 ring-rose-200",
};

export interface UploadStatusBadgeProps {
  status?: UploadStatus;
  className?: string;
}

const UploadStatusBadge: React.FC<UploadStatusBadgeProps> = ({ status = "idle", className }) => {
  if (status === "idle") return null;

  const Icon =
    status === "uploading" ? Loader2 : status === "uploaded" ? CheckCircle2 : XCircle;

  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium shadow-sm ring-1",
        STATUS_STYLES[status],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Icon className={["h-3 w-3", status === "uploading" ? "animate-spin" : ""].join(" ")} />
      {STATUS_LABELS[status]}
    </span>
  );
};

export default UploadStatusBadge;
