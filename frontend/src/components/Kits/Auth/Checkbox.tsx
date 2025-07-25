interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  className?: string;
}

export default function Checkbox({
  checked,
  onChange,
  label,
  className = "",
}: CheckboxProps) {
  return (
    <label className={`flex items-center gap-2 cursor-pointer ${className}`}>
      <div
        className="relative w-5 h-5 flex items-center justify-center"
        onClick={() => onChange(!checked)}
      >
        <div
          className={`w-5 h-5 border rounded transition-colors ${
            checked ? "border-sky-600 bg-sky-600" : "border-slate-400"
          }`}
        />
        {checked && (
          <svg
            className="w-3.5 h-3.5 text-white absolute"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M11.6667 3.5L5.25004 9.91667L2.33337 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      {label}
    </label>
  );
}
