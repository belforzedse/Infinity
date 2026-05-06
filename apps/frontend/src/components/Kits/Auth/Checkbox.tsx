interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  className?: string;
}

export default function Checkbox({ checked, onChange, label, className = "" }: CheckboxProps) {
  const handleToggle = () => onChange(!checked);

  return (
    <label className={`flex cursor-pointer items-center gap-2 ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={handleToggle}
        className="sr-only"
        aria-checked={checked}
      />

      <div className="relative flex h-5 w-5 items-center justify-center" onClick={handleToggle}>
        <div
          className={`h-5 w-5 rounded border transition-colors ${
            checked ? "border-sky-600 bg-sky-600" : "border-slate-400"
          }`}
        />
        {checked && (
          <svg
            className="absolute h-3.5 w-3.5 text-white"
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
