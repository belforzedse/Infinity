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
          dragActive ? "border-pink-500 bg-pink-50" : "border-gray-200",
        )}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <p className="text-sm mb-1 text-gray-600">برای بارگزاری، پرونده ها را بکشید</p>
        <p className="text-xs mb-1 text-gray-500">یا</p>
        <button className="text-xs mb-2 rounded-xl bg-pink-500 px-5 py-1.5 text-white transition-colors hover:bg-pink-600">
          بارگزاری پرونده
        </button>
        <p className="text-[10px] text-pink-500">حداکثر پرونده برای بارگزاری: 4 مگابایت.</p>
      </div>
    </div>
  );
}
