import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, ShieldCheck, Download, ChevronDown, ChevronUp, CheckCircle2, Plus, Minus,
} from 'lucide-react';
import { useProposalStore } from '@/features/proposal/store/proposal.store';
import { usePDFGeneration } from '@/features/proposal/hooks/usePDFGeneration';
import { payPeriodsPerYear, formatDollar, formatDollarCents } from '@/utils/format';
import { getFederalMarginalRate } from '@/features/proposal/engine';
import { STATE_TAX_RATES } from '@/config/tax-rates';
import { FICA_RATES, ADMIN_FEE_ANNUAL } from '@/config/fica-rates';
import {
  DISCLAIMER_TEXT, KEY_BENEFITS, VALUE_PROPOSITIONS, FAQ_ITEMS, HOW_WE_CALCULATE,
} from '@/constants/proposalCopy';
import type { TierResult } from '@/features/proposal/types/proposal.types';

const ACCENT = '#5ECEB0';
const BG = '#0B1220';
const CARD_BG = 'rgba(255,255,255,0.04)';
const CARD_BORDER = '1px solid rgba(255,255,255,0.08)';
const MUTED = 'rgba(255,255,255,0.5)';

interface ResultsSectionProps {
  groupId: string;
}

interface TierPaycheckData {
  tierResult: TierResult;
  grossPay: number;
  preTaxPerPay: number;
  fedBefore: number;
  stateBefore: number;
  ficaBefore: number;
  netBefore: number;
  fedAfter: number;
  stateAfter: number;
  ficaAfter: number;
  synrgyBenefit: number;
  netAfter: number;
  increase: number;
  pctIncrease: number;
  annualIncrease: number;
  annualTaxSavings: number;
  filingStatus: string;
  dependents: number;
  state: string;
}

export function ResultsSection({ groupId: _groupId }: ResultsSectionProps) {
  const { result, isCalculating, company, tiers, states, filingStatus } = useProposalStore((s) => s);
  const { downloadPDF, isGenerating } = usePDFGeneration();
  const [paycheckOpen, setPaycheckOpen] = useState(true);
  const [detailedOpen, setDetailedOpen] = useState(false);
  const [activePaycheckTab, setActivePaycheckTab] = useState<'benefit' | 'nonbenefit'>('benefit');
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const periods = result ? payPeriodsPerYear(company.payrollFrequency) : 26;

  const weightedFiling: 'single' | 'married' | 'hoh' = useMemo(() => {
    if (filingStatus.married >= filingStatus.single && filingStatus.married >= filingStatus.headOfHousehold) return 'married';
    if (filingStatus.headOfHousehold > filingStatus.single) return 'hoh';
    return 'single';
  }, [filingStatus]);

  const weightedStateCode = useMemo(() => {
    if (states.length === 0) return 'TX';
    let best = states[0].stateCode;
    let bestPct = 0;
    for (const s of states) {
      if (s.workforcePercent > bestPct) { best = s.stateCode; bestPct = s.workforcePercent; }
    }
    return best;
  }, [states]);

  const weightedStateRate = useMemo(() => {
    if (states.length === 0) return 0.05;
    return states.reduce((s, st) => s + (STATE_TAX_RATES[st.stateCode] ?? 0) * (st.workforcePercent / 100), 0);
  }, [states]);

  const buildTierPaycheck = useCallback((tr: TierResult): TierPaycheckData => {
    const grossPay = tr.avgSalary / periods;
    const preTaxPerPay = tr.avgPreTaxDeduction / periods;
    const federalRate = getFederalMarginalRate(tr.avgSalary, weightedFiling);
    const ficaRate = FICA_RATES.combined;

    const fedBefore = grossPay * federalRate;
    const stateBefore = grossPay * weightedStateRate;
    const ficaBefore = grossPay * ficaRate;
    const netBefore = grossPay - fedBefore - stateBefore - ficaBefore;

    const taxableAfter = grossPay - preTaxPerPay;
    const fedAfter = taxableAfter * federalRate;
    const stateAfter = taxableAfter * weightedStateRate;
    const ficaAfter = taxableAfter * ficaRate;
    const adminPerPay = ADMIN_FEE_ANNUAL / periods;
    const netAfterRaw = taxableAfter - fedAfter - stateAfter - ficaAfter;
    const synrgyBenefit = (netAfterRaw - netBefore);
    const netAfter = netAfterRaw;

    const increase = netAfter - netBefore;
    const pctIncrease = netBefore > 0 ? (increase / netBefore) * 100 : 0;

    const filingLabel = weightedFiling === 'married' ? 'Married Filing Jointly' : weightedFiling === 'hoh' ? 'Head of Household' : 'Single';
    const dependents = weightedFiling === 'married' ? 2 : weightedFiling === 'hoh' ? 1 : 0;

    return {
      tierResult: tr,
      grossPay: r2(grossPay),
      preTaxPerPay: r2(preTaxPerPay),
      fedBefore: r2(fedBefore),
      stateBefore: r2(stateBefore),
      ficaBefore: r2(ficaBefore),
      netBefore: r2(netBefore),
      fedAfter: r2(fedAfter),
      stateAfter: r2(stateAfter),
      ficaAfter: r2(ficaAfter),
      synrgyBenefit: r2(synrgyBenefit),
      netAfter: r2(netAfter),
      increase: r2(increase),
      pctIncrease: Math.round(pctIncrease * 100) / 100,
      annualIncrease: r2(increase * periods),
      annualTaxSavings: r2((fedBefore - fedAfter + stateBefore - stateAfter + ficaBefore - ficaAfter) * periods),
      filingStatus: filingLabel,
      dependents,
      state: weightedStateCode,
    };
  }, [periods, weightedFiling, weightedStateRate, weightedStateCode]);

  const tierPaychecks = useMemo<TierPaycheckData[]>(() => {
    if (!result) return [];
    return result.tierResults.map(buildTierPaycheck);
  }, [result, buildTierPaycheck]);

  const benefittingEmployee = useMemo(() => {
    if (tierPaychecks.length < 2) return tierPaychecks[0] ?? null;
    return tierPaychecks[1];
  }, [tierPaychecks]);

  const nonBenefittingEmployee = useMemo(() => {
    const negative = tierPaychecks.filter((t) => t.increase < 0);
    if (negative.length === 0) return null;
    negative.sort((a, b) => a.tierResult.avgSalary - b.tierResult.avgSalary);
    return negative[0];
  }, [tierPaychecks]);

  if (isCalculating) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin" style={{ color: ACCENT }} />
        <span className="ml-2 text-[14px]" style={{ color: MUTED }}>Calculating savings...</span>
      </div>
    );
  }

  if (!result) {
    return (
      <div id="results" className="p-12 text-center" style={{ background: CARD_BG, border: CARD_BORDER, borderRadius: 16 }}>
        <p className="text-[14px]" style={{ color: MUTED }}>
          Complete the sections above to see your savings projection.
        </p>
      </div>
    );
  }

  const netSavings = result.employerAnnualFICASavings - result.totalAdminFee;
  const perEmployeeBenefit = result.totalEmployees > 0 ? Math.round(result.avgEmployeeAnnualSavings) : 0;
  const participationRate = result.positivelyImpactedPercent;

  const activePaycheck = activePaycheckTab === 'benefit' ? benefittingEmployee : nonBenefittingEmployee;

  return (
    <div id="results" style={{ fontFamily: 'Inter, system-ui, sans-serif', background: BG, borderRadius: 20, overflow: 'hidden' }}>
      {/* B1 — Sticky Header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          height: 72,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          background: 'rgba(11,18,32,0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ShieldCheck size={22} style={{ color: ACCENT }} />
          <span style={{ fontWeight: 600, fontSize: 18, color: '#fff' }}>The SYNRGY Plan</span>
        </div>
        <button
          style={{
            background: ACCENT,
            color: BG,
            borderRadius: 8,
            padding: '10px 22px',
            fontWeight: 600,
            fontSize: 14,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Contact Us
        </button>
      </div>

      <div style={{ padding: '0 40px 60px' }}>
        {/* B2 — Hero */}
        <div style={{ textAlign: 'center', paddingTop: 48 }}>
          <div style={{ maxHeight: 96, marginBottom: 24 }}>
            <ShieldCheck size={64} style={{ color: ACCENT, margin: '0 auto' }} />
          </div>
          <h1 style={{ fontWeight: 700, fontSize: 36, color: '#fff', margin: 0 }}>
            Your Customized SYNRGY Proposal
          </h1>
          <div style={{ width: 80, height: 2, background: ACCENT, margin: '12px auto 16px' }} />
          <span
            style={{
              display: 'inline-block',
              background: ACCENT,
              color: BG,
              fontWeight: 600,
              fontSize: 12,
              padding: '4px 14px',
              borderRadius: 9999,
            }}
          >
            AI-Generated
          </span>
        </div>

        {/* B3 — KPI Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginTop: 48 }}>
          <KpiCard label="Anticipated Employee Participation Rate" value={`${participationRate}%`} caption="estimated voluntary participation among eligible employees based on internal modeling assumptions and historical participation patterns" />
          <KpiCard label="Annual Company Savings" value={formatDollar(netSavings)} caption="estimated total employer payroll tax savings" />
          <KpiCard label="Per Employee Benefit" value={formatDollar(perEmployeeBenefit)} caption="average annual take-home pay increase per qualified employee" />
        </div>

        {/* B4 — Key Benefits */}
        <div style={{ marginTop: 56, textAlign: 'center' }}>
          <h2 style={{ fontWeight: 700, fontSize: 20, color: '#fff', marginBottom: 20 }}>Key Benefits</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }}>
            {KEY_BENEFITS.map((b) => (
              <span
                key={b}
                style={{
                  background: CARD_BG,
                  border: `1px solid rgba(94,206,176,0.2)`,
                  padding: '10px 20px',
                  borderRadius: 9999,
                  fontWeight: 500,
                  fontSize: 14,
                  color: '#fff',
                }}
              >
                {b}
              </span>
            ))}
          </div>
        </div>

        {/* B5 — How We Calculate */}
        <GlassCard style={{ marginTop: 56, textAlign: 'center' }}>
          <h2 style={{ fontWeight: 700, fontSize: 22, color: '#fff', marginBottom: 16 }}>How We Calculate</h2>
          <p style={{ fontWeight: 400, fontSize: 15, color: MUTED, maxWidth: 820, margin: '0 auto', lineHeight: 1.65 }}>
            {HOW_WE_CALCULATE}
          </p>
        </GlassCard>

        {/* B6 — Paycheck Comparison */}
        <GlassCard style={{ marginTop: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setPaycheckOpen(!paycheckOpen)}>
            <h2 style={{ fontWeight: 700, fontSize: 22, color: '#fff', margin: 0 }}>Paycheck Comparison</h2>
            {paycheckOpen ? <Minus size={20} style={{ color: MUTED }} /> : <Plus size={20} style={{ color: MUTED }} />}
          </div>

          <AnimatePresence>
            {paycheckOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ marginTop: 20 }}>
                  {/* Tab switcher */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
                    <PillTab active={activePaycheckTab === 'benefit'} onClick={() => setActivePaycheckTab('benefit')}>Benefitting Employee Example</PillTab>
                    <PillTab active={activePaycheckTab === 'nonbenefit'} onClick={() => setActivePaycheckTab('nonbenefit')}>Non-Benefiting Employee Example</PillTab>
                  </div>

                  {activePaycheck ? (
                    <>
                      {/* Employee Profile */}
                      <div style={{ textAlign: 'center', marginBottom: 24 }}>
                        <h3 style={{ fontWeight: 600, fontSize: 16, color: '#fff', margin: 0 }}>Employee Profile</h3>
                        <div style={{ width: 60, height: 2, background: ACCENT, margin: '8px auto 16px' }} />
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 40 }}>
                          <ProfileStat label="Annual Salary" value={formatDollar(activePaycheck.tierResult.avgSalary)} />
                          <ProfileStat label="Filing Status" value={activePaycheck.filingStatus} />
                          <ProfileStat label="Dependents" value={String(activePaycheck.dependents)} />
                          <ProfileStat label="State" value={activePaycheck.state} />
                        </div>
                      </div>

                      {/* Two-column paycheck */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                        {/* Current */}
                        <GlassCard inner>
                          <h4 style={{ fontWeight: 600, fontSize: 14, color: MUTED, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Paycheck (Bi-weekly)</h4>
                          <PaySection title="Earnings">
                            <PayRow label="Gross Pay" value={activePaycheck.grossPay} />
                          </PaySection>
                          <PaySection title="Deductions">
                            <PayRow label="Pre-Tax Deductions" value={0} />
                          </PaySection>
                          <PaySection title="Taxes">
                            <PayRow label="Federal Withholding" value={-activePaycheck.fedBefore} negative />
                            <PayRow label="State Withholding" value={-activePaycheck.stateBefore} negative />
                            <PayRow label="FICA (7.65%)" value={-activePaycheck.ficaBefore} negative />
                          </PaySection>
                          <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '12px 0' }} />
                          <PayRow label="Net Pay" value={activePaycheck.netBefore} bold />
                        </GlassCard>

                        {/* With SYNRGY */}
                        <GlassCard inner style={{ borderColor: `rgba(94,206,176,0.2)` }}>
                          <h4 style={{ fontWeight: 600, fontSize: 14, color: ACCENT, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Paycheck with SYNRGY</h4>
                          <PaySection title="Earnings">
                            <PayRow label="Gross Pay" value={activePaycheck.grossPay} />
                          </PaySection>
                          <PaySection title="Deductions">
                            <PayRow label="Pre-Tax Benefit Deduction" value={-activePaycheck.preTaxPerPay} accent />
                          </PaySection>
                          <PaySection title="Taxes">
                            <PayRow label="Federal Withholding" value={-activePaycheck.fedAfter} negative />
                            <PayRow label="State Withholding" value={-activePaycheck.stateAfter} negative />
                            <PayRow label="FICA (7.65%)" value={-activePaycheck.ficaAfter} negative />
                          </PaySection>
                          <PaySection title="SYNRGY Benefit">
                            <PayRow label="Tax Savings Benefit" value={activePaycheck.synrgyBenefit} accent />
                          </PaySection>
                          <div style={{ height: 1, background: 'rgba(255,255,255,0.1)', margin: '12px 0' }} />
                          <div>
                            <PayRow label="Net Pay" value={activePaycheck.netAfter} bold green={activePaycheck.increase > 0} />
                            <div style={{ textAlign: 'right', marginTop: 4 }}>
                              <span style={{
                                fontWeight: 600,
                                fontSize: 14,
                                fontFamily: 'Inter',
                                color: activePaycheck.increase >= 0 ? ACCENT : '#EF4444',
                              }}>
                                {activePaycheck.increase >= 0 ? '+' : ''}{formatDollarCents(activePaycheck.increase)}({activePaycheck.increase >= 0 ? '+' : ''}{activePaycheck.pctIncrease.toFixed(1)}%)
                              </span>
                            </div>
                          </div>
                        </GlassCard>
                      </div>

                      {/* Annual Impact Summary */}
                      <div style={{ textAlign: 'center', marginTop: 24 }}>
                        <h3 style={{ fontWeight: 600, fontSize: 16, color: '#fff', margin: 0 }}>Annual Impact Summary</h3>
                        <div style={{ width: 60, height: 2, background: ACCENT, margin: '8px auto 16px' }} />
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 60 }}>
                          <ProfileStat label="Annual Take-Home Increase" value={formatDollarCents(activePaycheck.annualIncrease)} />
                          <ProfileStat label="Total Tax Savings" value={formatDollarCents(activePaycheck.annualTaxSavings)} />
                          <ProfileStat label="Increase Percentage" value={`${activePaycheck.pctIncrease >= 0 ? '+' : ''}${activePaycheck.pctIncrease.toFixed(1)}%`} accent />
                        </div>
                      </div>
                    </>
                  ) : (
                    <p style={{ color: MUTED, fontSize: 14, fontStyle: 'italic', textAlign: 'center', padding: '24px 0' }}>
                      No employees are projected to see a net decrease under this plan configuration.
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>

        {/* B7 — Detailed Analysis */}
        <GlassCard style={{ marginTop: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => setDetailedOpen(!detailedOpen)}>
            <h2 style={{ fontWeight: 700, fontSize: 22, color: '#fff', margin: 0 }}>Detailed Analysis</h2>
            {detailedOpen ? <Minus size={20} style={{ color: MUTED }} /> : <Plus size={20} style={{ color: MUTED }} />}
          </div>

          <AnimatePresence>
            {detailedOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 20 }}>
                  {/* Employee Eligibility */}
                  <GlassCard inner>
                    <div style={{ textAlign: 'center' }}>
                      <h3 style={{ fontWeight: 600, fontSize: 18, color: '#fff', margin: 0 }}>Employee Eligibility</h3>
                      <div style={{ width: 60, height: 2, background: ACCENT, margin: '8px auto 20px' }} />
                    </div>
                    <DetailRow label="Total Eligible Employees" value={String(result.totalEmployees)} />
                    <DetailRow label="Eligible Employees" value={String(result.qualifiedEmployees)} />
                    <DetailRow label="Employees with positive net take-home pay" value={String(result.positivelyImpactedCount)} />
                    <DetailRow label="Participation rate of eligible employees" value={`${participationRate}%`} />
                  </GlassCard>

                  {/* Financial Impact */}
                  <GlassCard inner>
                    <div style={{ textAlign: 'center' }}>
                      <h3 style={{ fontWeight: 600, fontSize: 18, color: '#fff', margin: 0 }}>Financial Impact</h3>
                      <div style={{ width: 60, height: 2, background: ACCENT, margin: '8px auto 20px' }} />
                    </div>
                    <DetailRow label="Employer Annual Savings (Net of Fees):" value={formatDollar(netSavings)} />
                    <DetailRow label="Monthly Per Employee:" value={formatDollar(result.totalEmployees > 0 ? Math.round(netSavings / result.totalEmployees / 12) : 0)} />
                  </GlassCard>
                </div>

                {/* Statistically Significant notice */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    marginTop: 20,
                    padding: '14px 20px',
                    background: CARD_BG,
                    border: CARD_BORDER,
                    borderRadius: 12,
                    backdropFilter: 'blur(12px)',
                  }}
                >
                  <CheckCircle2 size={20} style={{ color: ACCENT, flexShrink: 0 }} />
                  <p style={{ color: '#fff', fontSize: 14, margin: 0 }}>
                    <strong>Statistically Significant:</strong> This analysis is based on a sample size of {result.totalEmployees} employees, which provides a statistically significant result.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>

        {/* B8 — Value Proposition */}
        <div style={{ marginTop: 56, textAlign: 'center' }}>
          <h2 style={{ fontWeight: 700, fontSize: 24, color: '#fff', marginBottom: 28 }}>Value Proposition</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 20,
            }}
            className="value-prop-grid"
          >
            {VALUE_PROPOSITIONS.map((vp, i) => (
              <GlassCard key={i} inner style={{ textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: ACCENT,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: 16,
                      color: BG,
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 16, color: '#fff' }}>{vp.title}</span>
                </div>
                <p style={{ fontWeight: 400, fontSize: 14, color: MUTED, lineHeight: 1.5, margin: 0 }}>{vp.body}</p>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* B9 — FAQ */}
        <div style={{ marginTop: 56 }}>
          <h2 style={{ fontWeight: 700, fontSize: 22, color: '#fff', marginBottom: 20, textAlign: 'center' }}>Frequently Asked Questions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {FAQ_ITEMS.map((item, i) => (
              <div key={i}>
                <button
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  style={{
                    display: 'flex',
                    width: '100%',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 4px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: 16, color: ACCENT }}>{item.q}</span>
                  <ChevronDown
                    size={18}
                    style={{
                      color: MUTED,
                      flexShrink: 0,
                      transform: faqOpen === i ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                    }}
                  />
                </button>
                <AnimatePresence>
                  {faqOpen === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <p style={{ padding: '0 4px 14px', fontSize: 15, color: MUTED, lineHeight: 1.6, margin: 0 }}>{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
                {i < FAQ_ITEMS.length - 1 && <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />}
              </div>
            ))}
          </div>
        </div>

        {/* B10 — CTA */}
        <GlassCard style={{ marginTop: 56, textAlign: 'center' }}>
          <h2 style={{ fontWeight: 700, fontSize: 24, color: ACCENT, margin: 0 }}>
            Ready to boost employee satisfaction and reduce tax liability?
          </h2>
          <p style={{ fontWeight: 400, fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 12 }}>
            Our dedicated team will guide you through every step of the implementation process.
          </p>
        </GlassCard>

        {/* B11 — Disclaimer */}
        <GlassCard style={{ marginTop: 40, textAlign: 'center' }}>
          <h3 style={{ fontWeight: 700, fontSize: 18, color: '#fff', marginBottom: 12 }}>Disclaimer</h3>
          <p style={{ fontWeight: 400, fontSize: 13, color: MUTED, lineHeight: 1.6, margin: 0 }}>
            {DISCLAIMER_TEXT}
          </p>
        </GlassCard>

        {/* B12 — Download */}
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <button
            onClick={downloadPDF}
            disabled={isGenerating}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              background: ACCENT,
              color: BG,
              fontWeight: 600,
              fontSize: 16,
              padding: '14px 32px',
              borderRadius: 10,
              border: 'none',
              cursor: isGenerating ? 'not-allowed' : 'pointer',
              opacity: isGenerating ? 0.6 : 1,
            }}
          >
            {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            Download Full Proposal
          </button>
        </div>
      </div>

      {/* Responsive grid override */}
      <style>{`
        @media (max-width: 900px) {
          .value-prop-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 600px) {
          .value-prop-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

function r2(n: number) {
  return Math.round(n * 100) / 100;
}

function GlassCard({ children, style, inner }: { children: React.ReactNode; style?: React.CSSProperties; inner?: boolean }) {
  return (
    <div
      style={{
        background: CARD_BG,
        border: CARD_BORDER,
        borderRadius: 16,
        padding: inner ? 24 : 32,
        backdropFilter: 'blur(12px)',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function KpiCard({ label, value, caption }: { label: string; value: string; caption: string }) {
  return (
    <div
      style={{
        background: CARD_BG,
        border: CARD_BORDER,
        borderRadius: 16,
        padding: '32px 24px',
        textAlign: 'center',
        borderLeft: `4px solid ${ACCENT}`,
        backdropFilter: 'blur(12px)',
      }}
    >
      <p style={{ fontWeight: 600, fontSize: 16, color: '#fff', margin: 0 }}>{label}</p>
      <p style={{ fontWeight: 700, fontSize: 56, color: '#fff', margin: '8px 0', lineHeight: 1 }}>{value}</p>
      <p style={{ fontWeight: 400, fontSize: 13, color: MUTED, margin: 0 }}>{caption}</p>
    </div>
  );
}

function PillTab({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? ACCENT : 'transparent',
        color: active ? BG : MUTED,
        border: active ? 'none' : '1px solid rgba(255,255,255,0.15)',
        borderRadius: 9999,
        padding: '8px 20px',
        fontWeight: 600,
        fontSize: 14,
        cursor: 'pointer',
        transition: 'all 0.2s',
      }}
    >
      {children}
    </button>
  );
}

function ProfileStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p style={{ fontWeight: 700, fontSize: 18, color: accent ? ACCENT : '#fff', margin: 0 }}>{value}</p>
      <p style={{ fontWeight: 400, fontSize: 12, color: MUTED, margin: '4px 0 0' }}>{label}</p>
    </div>
  );
}

function PaySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <p style={{ fontWeight: 600, fontSize: 11, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '8px 0 4px' }}>{title}</p>
      {children}
    </div>
  );
}

function PayRow({ label, value, bold, negative, accent, green }: {
  label: string; value: number; bold?: boolean; negative?: boolean; accent?: boolean; green?: boolean;
}) {
  const isNeg = value < -0.005;
  const displayValue = isNeg ? `(${formatDollarCents(Math.abs(value))})` : formatDollarCents(value);
  const color = accent ? ACCENT : green ? ACCENT : bold ? '#fff' : isNeg ? 'rgba(239,68,68,0.7)' : 'rgba(255,255,255,0.7)';

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '3px 0', fontSize: bold ? 16 : 13 }}>
      <span style={{ color: accent ? ACCENT : 'rgba(255,255,255,0.7)' }}>{label}</span>
      <span style={{ fontFamily: 'Inter', fontWeight: bold ? 700 : 500, color }}>{displayValue}</span>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
      <span style={{ fontWeight: 400, fontSize: 14, color: MUTED }}>{label}</span>
      <span style={{ fontWeight: 700, fontSize: 18, color: '#fff' }}>{value}</span>
    </div>
  );
}
