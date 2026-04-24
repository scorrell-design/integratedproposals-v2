import { CheckCircle, XCircle } from 'lucide-react';
import type { RecognizedField } from '../engine/mini-file-validator';

interface RecognizedFieldsViewProps {
  recognizedFields: RecognizedField[];
  rowCount: number;
  fileName: string;
  companyName?: string;
}

export function RecognizedFieldsView({ recognizedFields, rowCount, fileName, companyName }: RecognizedFieldsViewProps) {
  // Only show required fields + optional fields that were actually detected
  const relevantFields = recognizedFields.filter((f) => f.required || f.status === 'detected');
  const detectedFields = relevantFields.filter((f) => f.status === 'detected');
  const hasRequiredMissing = recognizedFields.some((f) => f.required && f.status === 'not_detected');

  const fileExt = fileName.split('.').pop()?.toLowerCase();
  const fileType = fileExt === 'csv' ? 'CSV' : fileExt === 'xlsx' || fileExt === 'xls' ? 'Excel Census' : 'Data File';

  return (
    <div className="glass-primary">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Left: Recognized Fields */}
        <div>
          <p
            className="font-medium text-text-tertiary"
            style={{ fontSize: 12, letterSpacing: '0.05em', textTransform: 'uppercase' }}
          >
            Recognized Fields
          </p>
          <div className="mt-4 flex flex-col" style={{ gap: 12 }}>
            {relevantFields.map((field) => (
              <FieldRow key={field.key} field={field} />
            ))}
          </div>
        </div>

        {/* Right: Group Summary */}
        <div>
          <p
            className="font-medium text-text-tertiary"
            style={{ fontSize: 12, letterSpacing: '0.05em', textTransform: 'uppercase' }}
          >
            Group Summary
          </p>
          <div className="mt-4 flex flex-col" style={{ gap: 16 }}>
            <SummaryRow label="Company Name" value={companyName || fileName.replace(/\.[^.]+$/, '')} />
            <SummaryRow label="Employees Detected" value={String(rowCount)} />
            <SummaryRow label="Pay Cycle" value="Bi-weekly" />
            <SummaryRow label="File Type" value={fileType} />
            <SummaryRow label="Fields Detected" value={`${detectedFields.length} of ${relevantFields.length}`} />
          </div>
        </div>
      </div>

      {/* Status message */}
      <div style={{ marginTop: 24 }}>
        {hasRequiredMissing ? (
          <p className="text-[13px] font-medium" style={{ color: '#DC2626' }}>
            A required field is missing. Map the salary/compensation column to continue.
          </p>
        ) : (
          <p className="text-[13px] text-text-secondary">
            All required fields detected. {detectedFields.length > 3 ? 'Strong data coverage for high-accuracy analysis.' : 'Map optional columns above for enhanced accuracy.'}
          </p>
        )}
      </div>
    </div>
  );
}

function FieldRow({ field }: { field: RecognizedField }) {
  if (field.status === 'detected') {
    return (
      <div className="flex items-center gap-2.5">
        <CheckCircle size={16} style={{ color: '#059669', flexShrink: 0 }} />
        <span className="text-[14px] text-text-primary">{field.label}</span>
        <span className="text-[12px] text-text-secondary">detected</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      <XCircle size={16} style={{ color: '#DC2626', flexShrink: 0 }} />
      <span className="text-[14px] text-text-primary">{field.label}</span>
      <span className="text-[12px]" style={{ color: '#DC2626' }}>not detected (required)</span>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[12px] text-text-tertiary">{label}</p>
      <p className="mt-0.5 text-[15px] font-semibold text-text-primary">{value}</p>
    </div>
  );
}
