import { SectionCard } from '@/features/proposal/components/shared/SectionCard';
import { ValidationBanner } from '@/features/proposal/components/shared/ValidationBanner';
import { CANONICAL_FIELDS } from '@/config/field-aliases';
import type { ColumnMapping, ValidationResult } from '../engine/mini-file-validator';

interface ColumnMappingSectionProps {
  columns: string[];
  mapping: ColumnMapping;
  validation: ValidationResult;
  onUpdateMapping: (field: string, column: string | null) => void;
  onConfirm: () => void;
}

export function ColumnMappingSection({ columns, mapping, validation, onUpdateMapping, onConfirm }: ColumnMappingSectionProps) {
  const requiredFields = CANONICAL_FIELDS.filter((f) => f.classification === 'required');
  const optionalMapped = CANONICAL_FIELDS.filter((f) => f.classification !== 'required' && mapping[f.canonical]);

  return (
    <SectionCard id="mapping" title="Column Mapping" subtitle="Verify that columns are mapped correctly">
      {validation.errors.map((err) => (
        <div key={err} className="mb-2"><ValidationBanner type="error" message={err} /></div>
      ))}
      {validation.warnings.map((warn) => (
        <div key={warn} className="mb-2"><ValidationBanner type="warning" message={warn} /></div>
      ))}

      <div className="space-y-3 mt-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-text-tertiary">Required Fields</p>
        {requiredFields.map((def) => (
          <MappingRow
            key={def.canonical}
            label={def.label}
            required
            value={mapping[def.canonical] ?? ''}
            columns={columns}
            onChange={(col) => onUpdateMapping(def.canonical, col || null)}
          />
        ))}

        {optionalMapped.length > 0 && (
          <>
            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-text-tertiary pt-3">Detected Optional Fields</p>
            {optionalMapped.map((def) => (
              <MappingRow
                key={def.canonical}
                label={def.label}
                required={false}
                value={mapping[def.canonical] ?? ''}
                columns={columns}
                onChange={(col) => onUpdateMapping(def.canonical, col || null)}
              />
            ))}
          </>
        )}
      </div>

      <div style={{ marginTop: 24 }}>
        <button
          onClick={onConfirm}
          disabled={!validation.isValid}
          className="btn-accent disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Confirm Mapping &amp; Generate Proposal
        </button>
        {!validation.isValid && (
          <p className="mt-3 text-[13px] text-warning">
            Map all required columns to continue.
          </p>
        )}
        {validation.isValid && (
          <p className="mt-3 text-[13px] text-text-tertiary">
            Optional columns enhance accuracy if mapped.
          </p>
        )}
      </div>
    </SectionCard>
  );
}

function MappingRow({ label, required, value, columns, onChange }: {
  label: string;
  required: boolean;
  value: string;
  columns: string[];
  onChange: (col: string) => void;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="w-52 text-[14px]">
        <span className="font-medium text-text-primary">{label}</span>
        {required && <span className="text-error ml-1">*</span>}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="glass-input flex-1 px-3.5 py-2.5 text-[14px]"
      >
        <option value="">— Not mapped —</option>
        {columns.map((col) => <option key={col} value={col}>{col}</option>)}
      </select>
    </div>
  );
}
