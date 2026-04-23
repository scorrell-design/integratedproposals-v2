import { useCallback } from 'react';

interface DollarInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
}

export function DollarInput({
  value,
  onChange,
  min = 0,
  max = 99999,
  placeholder = '0',
  disabled = false,
  label,
}: DollarInputProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      if (raw === '') { onChange(0); return; }
      const num = parseFloat(raw);
      if (!isNaN(num)) onChange(Math.min(max, Math.max(min, num)));
    },
    [onChange, max, min],
  );

  return (
    <div className="flex flex-col" style={{ gap: 8 }}>
      {label && (
        <label className="text-[14px] font-medium text-text-secondary">{label}</label>
      )}
      <div className="relative inline-flex items-center" style={{ maxWidth: 100 }}>
        <span className="pointer-events-none absolute left-2.5 text-[13px] text-text-tertiary">$</span>
        <input
          type="number"
          value={value || ''}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          min={min}
          max={max}
          step={1}
          className="glass-input w-full py-2 pl-7 pr-3 text-right font-mono text-[15px] font-semibold
                     disabled:opacity-40"
        />
      </div>
    </div>
  );
}
