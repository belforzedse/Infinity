import classNames from "classnames";

interface UploaderProps {
  dragActive: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

export default function Uploader({ dragActive, onDragOver, onDragLeave, onDrop }: UploaderProps) {
  return (
    <div className="flex-1">
      <div
        className={classNames(
          "flex h-full flex-col items-center justify-center rounded-lg",
          dragActive ? "border-infinity-primary bg-infinity-primary-lighter/20" : "border-gray-200",
        )}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <p className="text-sm mb-1 text-gray-600">برای بارگزاری، پرونده ها را بکشید</p>
        <p className="text-xs mb-1 text-gray-500">یا</p>
        <button className="text-xs mb-2 rounded-xl bg-infinity-primary px-5 py-1.5 text-white transition-colors hover:bg-infinity-primary">
          بارگزاری پرونده
        </button>
        <p className="text-[10px] text-infinity-primary">حداکثر پرونده برای بارگزاری: 4 مگابایت.</p>
      </div>
    </div>
  );
}
