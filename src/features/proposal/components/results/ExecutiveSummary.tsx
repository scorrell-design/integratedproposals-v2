import { formatDollar } from '@/utils/format';
import type { ProposalResult } from '../../types/proposal.types';

interface ExecutiveSummaryProps {
  result: ProposalResult;
  payPeriodsPerYear: number;
}

export function ExecutiveSummary({ result, payPeriodsPerYear: _payPeriodsPerYear }: ExecutiveSummaryProps) {
  const qualifiedPct = result.totalEmployees > 0 ? Math.round((result.qualifiedEmployees / result.totalEmployees) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* KPI Strip — 3 equal-width cards */}
      <div className="glass-primary" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0 }}>
          {/* Employer Savings */}
          <KPICell
            label="Annual Employer Savings"
            value={formatDollar(result.employerAnnualFICASavings)}
            sublabel="Employer FICA only (7.65%)"
          />

          {/* Avg Employee Take-Home */}
          <KPICell
            label="Avg. Employee Take-Home Increase"
            value={`${formatDollar(result.avgEmployeeAnnualSavings)}/yr`}
            sublabel="Per qualified employee"
          />

          {/* Qualified Employees */}
          <KPICell
            label="Qualified Employees"
            value={`${result.qualifiedEmployees} / ${result.totalEmployees}`}
            sublabel={`${qualifiedPct}% of workforce`}
          />
        </div>
      </div>
    </div>
  );
}

function KPICell({ label, value, sublabel }: { label: string; value: string; sublabel: string }) {
  return (
    <div style={{ padding: '28px 20px', borderRight: '1px solid #D9CFC0' }}>
      <p
        className="font-medium text-text-tertiary"
        style={{ fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase' }}
      >
        {label}
      </p>
      <p className="mt-3 font-mono text-[24px] font-bold text-text-primary leading-none">
        {value}
      </p>
      <p className="mt-2 text-[12px] text-text-tertiary">{sublabel}</p>
    </div>
  );
}
