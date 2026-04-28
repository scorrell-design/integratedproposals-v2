import { formatDollar } from '@/utils/format';
import type { ProposalResult } from '../../types/proposal.types';

interface ExecutiveSummaryProps {
  result: ProposalResult;
  payPeriodsPerYear: number;
}

export function ExecutiveSummary({ result, payPeriodsPerYear: _payPeriodsPerYear }: ExecutiveSummaryProps) {
  const qualifiedPct = result.totalEmployees > 0 ? Math.round((result.qualifiedEmployees / result.totalEmployees) * 100) : 0;
  const bd = result.combinedSavingsBreakdown;

  return (
    <div className="space-y-4">
      {/* KPI Strip — 4 cards, hero first at 1.4x width */}
      <div className="glass-primary" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 0 }}>
          {/* Hero — Combined Tax Savings */}
          <div
            style={{
              padding: '28px 24px',
              borderRight: '1px solid #D9CFC0',
              background: 'rgba(0, 95, 120, 0.04)',
            }}
          >
            <p
              className="font-medium"
              style={{ fontSize: 12, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--color-synrgy-teal)' }}
            >
              Combined Annual Tax Savings
            </p>
            <p className="mt-3 font-mono font-bold text-accent leading-none" style={{ fontSize: 40 }}>
              {formatDollar(result.combinedAnnualTaxSavings)}
            </p>
            <p className="mt-2 text-[13px] text-text-secondary">
              ~{formatDollar(result.combinedPerEmployeeSavings)} per employee/year
            </p>
          </div>

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

      {/* Savings Breakdown — 3-row composition */}
      <div className="glass-primary">
        <h3
          className="font-semibold text-text-primary"
          style={{ fontSize: 16, marginBottom: 16 }}
        >
          Combined Tax Savings — Composition
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <BreakdownRow label="Employer FICA savings (7.65%)" value={bd.employerFICA} />
          <BreakdownRow label="Employee FICA savings (7.65%)" value={bd.employeeFICA} />
          <BreakdownRow label="Employee federal tax avoidance (~22%)" value={bd.employeeFederalTax} />
          <div style={{ height: 1, background: '#D9CFC0', margin: '4px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
            <span className="font-semibold text-text-primary" style={{ fontSize: 14 }}>
              Total combined annual savings
            </span>
            <span className="font-mono font-bold text-accent" style={{ fontSize: 18 }}>
              {formatDollar(result.combinedAnnualTaxSavings)}
            </span>
          </div>
        </div>
        <p className="text-text-tertiary" style={{ fontSize: 12, marginTop: 12, lineHeight: 1.6, fontStyle: 'italic' }}>
          Combined savings reflects total tax avoidance across employer payroll taxes and employee paycheck taxes when benefits are pre-taxed under Section 125. Employee federal tax estimate uses a 22% blended bracket; actual savings vary by individual filing status.
        </p>
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

function BreakdownRow({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(217, 207, 192, 0.5)' }}>
      <span className="text-text-secondary" style={{ fontSize: 14 }}>{label}</span>
      <span className="font-mono font-semibold text-text-primary" style={{ fontSize: 15 }}>
        {formatDollar(value)}
      </span>
    </div>
  );
}
