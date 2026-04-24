import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { formatDollar, formatDollarCents } from '@/utils/format';
import { STATE_NAMES } from '@/config/tax-rates';
import type { EmployeeResult } from '../engine/mini-analyzer';

export interface PlanTierRow {
  tier: string;
  employeeCount: number;
  pct: number;
  avgSalary: number;
  avgPaycheckIncrease: number;
  avgAnnualImpact: number;
  employees: EmployeeResult[];
}

interface PlanTierBreakdownProps {
  rows: PlanTierRow[];
  totalEmployees: number;
  payPeriodsPerYear: number;
}

export function buildPlanTierRows(
  employeeResults: EmployeeResult[],
  payPeriodsPerYear: number,
): PlanTierRow[] {
  const groups = new Map<string, EmployeeResult[]>();
  for (const er of employeeResults) {
    const tier = er.employee.planTier;
    if (!tier) continue;
    const list = groups.get(tier) ?? [];
    list.push(er);
    groups.set(tier, list);
  }

  const rows: PlanTierRow[] = [];
  for (const [tier, emps] of groups) {
    const avgSalary = emps.reduce((s, e) => s + e.employee.salary, 0) / emps.length;
    const avgAnnualImpact = emps.reduce((s, e) => s + e.netImpact, 0) / emps.length;
    const avgPaycheckIncrease = avgAnnualImpact / payPeriodsPerYear;
    rows.push({
      tier,
      employeeCount: emps.length,
      pct: 0,
      avgSalary,
      avgPaycheckIncrease,
      avgAnnualImpact,
      employees: emps,
    });
  }

  const total = employeeResults.length;
  for (const row of rows) {
    row.pct = total > 0 ? Math.round((row.employeeCount / total) * 100) : 0;
  }

  // Sort highest premium first (parse first number from tier label)
  rows.sort((a, b) => {
    const numA = parseFloat(a.tier.replace(/[^0-9.]/g, '')) || 0;
    const numB = parseFloat(b.tier.replace(/[^0-9.]/g, '')) || 0;
    return numB - numA;
  });

  return rows;
}

export function PlanTierBreakdown({ rows, totalEmployees, payPeriodsPerYear }: PlanTierBreakdownProps) {
  const [expandedTier, setExpandedTier] = useState<string | null>(null);

  return (
    <div className="glass-primary overflow-hidden !p-0">
      <div className="px-6 py-4">
        <h3 className="text-[18px] font-semibold text-text-primary">Tier Breakdown</h3>
        <p className="mt-1 text-[11px] italic text-text-tertiary">Estimates based on provided data</p>
      </div>

      {/* Header */}
      <div
        className="grid gap-4 px-6 py-2.5 text-[11px] font-medium uppercase tracking-[0.05em] text-text-tertiary"
        style={{ background: '#FAF5EC', gridTemplateColumns: '1.4fr 1fr 1fr 1.2fr 1fr' }}
      >
        <div>Tier</div>
        <div className="text-right"># Employees (%)</div>
        <div className="text-right">Avg. Salary</div>
        <div className="text-right">Est. Paycheck Increase</div>
        <div className="text-right">Annual Impact</div>
      </div>

      {/* Rows */}
      {rows.map((row, i) => (
        <div key={row.tier}>
          <button
            onClick={() => setExpandedTier(expandedTier === row.tier ? null : row.tier)}
            className="grid w-full gap-4 px-6 py-3 text-[14px] text-left transition-colors hover:bg-surface-glass-light"
            style={{
              background: i % 2 === 0 ? '#FFFFFF' : '#FAF5EC',
              gridTemplateColumns: '1.4fr 1fr 1fr 1.2fr 1fr',
            }}
          >
            <div className="flex items-center gap-2 font-medium text-text-primary">
              <motion.span animate={{ rotate: expandedTier === row.tier ? 180 : 0 }} className="inline-block">
                <ChevronDown className="h-3.5 w-3.5 text-text-tertiary" />
              </motion.span>
              {row.tier}
            </div>
            <div className="text-right font-mono text-text-secondary">
              {row.employeeCount} ({row.pct}%)
            </div>
            <div className="text-right font-mono text-text-secondary">{formatDollar(row.avgSalary)}</div>
            <div className="text-right font-mono font-semibold text-accent">
              {row.avgPaycheckIncrease >= 0 ? '+' : ''}{formatDollarCents(row.avgPaycheckIncrease)}/paycheck
            </div>
            <div className={`text-right font-mono font-semibold ${row.avgAnnualImpact >= 0 ? 'text-success' : 'text-text-secondary'}`}>
              {row.avgAnnualImpact >= 0 ? '+' : ''}{formatDollar(row.avgAnnualImpact)}/year
            </div>
          </button>

          <AnimatePresence>
            {expandedTier === row.tier && (
              <ExpandedTierDetail
                employees={row.employees}
                payPeriodsPerYear={payPeriodsPerYear}
              />
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}

function ExpandedTierDetail({ employees, payPeriodsPerYear }: { employees: EmployeeResult[]; payPeriodsPerYear: number }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? employees : employees.slice(0, 10);
  const hasMore = employees.length > 10 && !showAll;

  const filingLabel = (s: string) => s === 'married' ? 'Married' : s === 'hoh' ? 'Head of Household' : 'Single';

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="px-6 py-4" style={{ background: '#FAF5EC' }}>
        {/* Employee table header */}
        <div
          className="grid gap-3 mb-2 text-[10px] font-medium uppercase tracking-[0.05em] text-text-tertiary"
          style={{ gridTemplateColumns: '1.4fr 1fr 0.8fr 0.6fr 1fr 1fr' }}
        >
          <div>Employee</div>
          <div className="text-right">Annual Salary</div>
          <div className="text-right">Filing</div>
          <div className="text-right">State</div>
          <div className="text-right">Paycheck Increase</div>
          <div className="text-right">Annual Impact</div>
        </div>

        {visible.map((er) => {
          const perPaycheck = er.netImpact / payPeriodsPerYear;
          return (
            <div
              key={er.employee.employeeId}
              className="grid gap-3 py-1.5 text-[12px]"
              style={{ gridTemplateColumns: '1.4fr 1fr 0.8fr 0.6fr 1fr 1fr', borderTop: '1px solid rgba(217, 207, 192, 0.5)' }}
            >
              <div className="text-text-secondary truncate">{er.employee.name}</div>
              <div className="text-right font-mono text-text-secondary">{formatDollar(er.employee.salary)}</div>
              <div className="text-right text-text-tertiary">{filingLabel(er.employee.filingStatus)}</div>
              <div className="text-right text-text-tertiary">{STATE_NAMES[er.employee.stateCode] || er.employee.stateCode}</div>
              <div className="text-right font-mono text-accent">
                {perPaycheck >= 0 ? '+' : ''}{formatDollarCents(perPaycheck)}
              </div>
              <div className={`text-right font-mono ${er.netImpact >= 0 ? 'text-success' : 'text-text-tertiary'}`}>
                {er.netImpact >= 0 ? '+' : ''}{formatDollar(er.netImpact)}
              </div>
            </div>
          );
        })}

        {hasMore && (
          <button
            onClick={() => setShowAll(true)}
            className="mt-2 text-[12px] font-medium text-accent hover:underline"
          >
            Show all {employees.length} employees
          </button>
        )}
      </div>
    </motion.div>
  );
}
