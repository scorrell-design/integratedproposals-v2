import { STATE_NAMES } from '@/config/tax-rates';

interface ProposalHeaderBandProps {
  companyName: string;
  employeeCount: number;
  stateCodes: string[];
  payCycle: string;
}

export function ProposalHeaderBand({ companyName, employeeCount, stateCodes, payCycle }: ProposalHeaderBandProps) {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const validCodes = [...new Set(stateCodes)].filter((c) => /^[A-Z]{2}$/i.test(c));
  const stateLabels = validCodes.slice(0, 3).map((c) => c.toUpperCase()).join(', ');

  return (
    <div className="glass-primary flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="text-[22px] font-bold text-text-primary">{companyName || 'Your Company'}</h2>
        <p className="mt-1 text-[14px] text-text-secondary">Hospital Indemnity Plan Analysis</p>
        <p className="mt-0.5 text-[13px] text-text-tertiary">Prepared {date}</p>
      </div>
      <div className="text-right">
        <p className="text-[16px] font-semibold text-text-primary">{employeeCount} Employees</p>
        {stateLabels && <p className="mt-0.5 text-[14px] text-text-secondary">{stateLabels}</p>}
        <p className="mt-0.5 text-[14px] text-text-secondary">{payCycle}</p>
      </div>
    </div>
  );
}
