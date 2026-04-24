import { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RecognizedField, FieldStatus } from '../engine/mini-file-validator';

interface RecognizedFieldsViewProps {
  recognizedFields: RecognizedField[];
  rowCount: number;
  fileName: string;
  companyName?: string;
}

interface FieldGroup {
  id: string;
  title: string;
  fields: RecognizedField[];
  defaultOpen: boolean;
  conditional?: boolean;
}

export function RecognizedFieldsView({ recognizedFields, rowCount, fileName, companyName }: RecognizedFieldsViewProps) {
  const groups = buildGroups(recognizedFields);
  const detectedCount = recognizedFields.filter((f) => f.status === 'detected' || f.status === 'auto_filled').length;
  const totalCount = recognizedFields.filter((f) => f.group !== 'stateSpecific' || f.status !== 'not_detected').length;
  const hasRequiredMissing = recognizedFields.some((f) => f.status === 'required_missing');

  const fileExt = fileName.split('.').pop()?.toLowerCase();
  const fileType = fileExt === 'csv' ? 'CSV' : fileExt === 'xlsx' || fileExt === 'xls' ? 'Excel Census' : 'Data File';

  return (
    <div className="glass-primary">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Left: Recognized Fields */}
        <div>
          <p className="font-medium text-text-tertiary" style={{ fontSize: 12, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Recognized Fields
          </p>
          <div className="mt-4 flex flex-col" style={{ gap: 4 }}>
            {groups.map((group) => (
              <FieldGroupSection key={group.id} group={group} />
            ))}
          </div>
        </div>

        {/* Right: Group Summary */}
        <div>
          <p className="font-medium text-text-tertiary" style={{ fontSize: 12, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Group Summary
          </p>
          <div className="mt-4 flex flex-col" style={{ gap: 16 }}>
            <SummaryRow label="Company Name" value={companyName || fileName.replace(/\.[^.]+$/, '')} />
            <SummaryRow label="Employees Detected" value={String(rowCount)} />
            <SummaryRow label="File Type" value={fileType} />
            <SummaryRow label="Fields Detected" value={`${detectedCount} of ${totalCount}`} />
          </div>
        </div>
      </div>

      {/* Status message */}
      <div style={{ marginTop: 24 }}>
        {hasRequiredMissing ? (
          <p className="text-[13px] font-medium" style={{ color: '#DC2626' }}>
            One or more required fields are missing. Map the required columns to continue.
          </p>
        ) : (
          <p className="text-[13px] text-text-secondary">
            All required fields detected. {detectedCount > 10 ? 'Strong data coverage for high-accuracy analysis.' : 'Map optional columns above for enhanced accuracy.'}
          </p>
        )}
      </div>
    </div>
  );
}

function FieldGroupSection({ group }: { group: FieldGroup }) {
  const [open, setOpen] = useState(group.defaultOpen);
  const detectedInGroup = group.fields.filter((f) => f.status === 'detected' || f.status === 'auto_filled').length;

  return (
    <div style={{ borderBottom: '1px solid rgba(217, 207, 192, 0.4)' }}>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-2.5 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-semibold text-text-primary">{group.title}</span>
          <span className="text-[11px] text-text-tertiary">
            {detectedInGroup}/{group.fields.length}
          </span>
        </div>
        <motion.span animate={{ rotate: open ? 180 : 0 }} className="text-text-tertiary">
          <ChevronDown size={14} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col pb-2.5" style={{ gap: 8, paddingLeft: 4 }}>
              {group.fields.map((field) => (
                <FieldRow key={field.key} field={field} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FieldRow({ field }: { field: RecognizedField }) {
  const icon = statusIcon(field.status);
  const statusLabel = statusText(field);

  return (
    <div className="flex items-center gap-2" title={statusTooltip(field)}>
      {icon}
      <span className="text-[13px] text-text-primary">{field.label}</span>
      <span className={`text-[11px] ${statusColor(field.status)}`}>{statusLabel}</span>
    </div>
  );
}

function statusIcon(status: FieldStatus) {
  switch (status) {
    case 'detected':
      return <CheckCircle size={14} style={{ color: '#059669', flexShrink: 0 }} />;
    case 'auto_filled':
      return <Info size={14} style={{ color: '#3B82F6', flexShrink: 0 }} />;
    case 'not_detected':
      return <AlertTriangle size={14} style={{ color: '#D97706', flexShrink: 0 }} />;
    case 'required_missing':
      return <XCircle size={14} style={{ color: '#DC2626', flexShrink: 0 }} />;
  }
}

function statusColor(status: FieldStatus): string {
  switch (status) {
    case 'detected': return 'text-success';
    case 'auto_filled': return 'text-blue-500';
    case 'not_detected': return 'text-text-tertiary';
    case 'required_missing': return 'text-error';
  }
}

function statusText(field: RecognizedField): string {
  switch (field.status) {
    case 'detected':
      return 'detected';
    case 'auto_filled':
      return `auto-filled from ${field.autoFilledFrom}`;
    case 'not_detected':
      return field.classification === 'conditional' ? 'conditional' : 'optional';
    case 'required_missing':
      return 'required — missing';
  }
}

function statusTooltip(field: RecognizedField): string {
  if (field.status === 'detected') {
    const validInfo = field.validRowCount != null && field.totalRowCount != null
      ? ` ${field.validRowCount} of ${field.totalRowCount} rows have valid data.`
      : '';
    return `${field.label} detected in column "${field.matchedColumn}".${validInfo}`;
  }
  if (field.status === 'auto_filled') {
    return `${field.label} auto-filled from ${field.autoFilledFrom} for all employees.`;
  }
  if (field.status === 'required_missing') {
    return `${field.label} is required. Please add this column to your file.`;
  }
  return `${field.label} not found. Optional — including it improves accuracy.`;
}

function buildGroups(fields: RecognizedField[]): FieldGroup[] {
  const groups: FieldGroup[] = [];

  const employeePay = fields.filter((f) => f.group === 'employeePay');
  if (employeePay.length > 0) {
    groups.push({ id: 'employeePay', title: 'Employee & Pay', fields: employeePay, defaultOpen: true });
  }

  const taxFiling = fields.filter((f) => f.group === 'taxFiling');
  if (taxFiling.length > 0) {
    groups.push({ id: 'taxFiling', title: 'Tax Filing', fields: taxFiling, defaultOpen: false });
  }

  const benefits = fields.filter((f) => f.group === 'benefitsDeductions');
  if (benefits.length > 0) {
    groups.push({ id: 'benefitsDeductions', title: 'Benefits & Deductions', fields: benefits, defaultOpen: false });
  }

  // State-specific: only show if any state-specific fields are relevant (not all 'not_detected')
  const stateSpecific = fields.filter((f) => f.group === 'stateSpecific' && f.status !== 'not_detected');
  if (stateSpecific.length > 0) {
    groups.push({ id: 'stateSpecific', title: 'State-Specific', fields: stateSpecific, defaultOpen: false, conditional: true });
  }

  return groups;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[12px] text-text-tertiary">{label}</p>
      <p className="mt-0.5 text-[15px] font-semibold text-text-primary">{value}</p>
    </div>
  );
}
