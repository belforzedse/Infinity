import classNames from "classnames";

interface UploaderProps {
  dragActive: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

export default function Uploader({
  dragActive,
  onDragOver,
  onDragLeave,
  onDrop,
}: UploaderProps) {
  return (
    <div className="flex-1">
      <div
        className={classNames(
          "rounded-lg flex flex-col items-center justify-center h-full",
          dragActive ? "border-pink-500 bg-pink-50" : "border-gray-200"
        )}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <p className="text-gray-600 mb-1 text-sm">
          برای بارگزاری، پرونده ها را بکشید
        </p>
        <p className="text-gray-500 mb-1 text-xs">یا</p>
        <button className="bg-pink-500 text-white px-5 py-1.5 rounded-xl hover:bg-pink-600 transition-colors mb-2 text-xs">
          بارگزاری پرونده
        </button>
        <p className="text-pink-500 text-[10px]">
          حداکثر پرونده برای بارگزاری: 4 مگابایت.
        </p>
      </div>
    </div>
  );
}
