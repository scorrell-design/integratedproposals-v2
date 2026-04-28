import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Info, Sparkles } from 'lucide-react';
import { useProposalStore } from '@/features/proposal/store/proposal.store';
import { useProposalCalculation } from '@/features/proposal/hooks/useProposalCalculation';
import { GlassBackground } from '@/features/proposal/components/shared/GlassBackground';
import { DisclaimerModal } from '@/features/proposal/components/shared/DisclaimerModal';
import { ProgressSidebar } from './components/ProgressSidebar';
import { HeroSection } from './sections/HeroSection';
import { CompanyInfoSection } from './sections/CompanyInfoSection';
import { StateDistributionSection } from './sections/StateDistributionSection';
import { FilingStatusSection } from './sections/FilingStatusSection';
import { SalaryInsightsSection } from './sections/SalaryInsightsSection';
import { BenefitsSection } from './sections/BenefitsSection';
import { ResultsSection } from './sections/ResultsSection';
import type { SalaryTier } from '@/features/proposal/types/proposal.types';

const DISCLAIMER_TEXT = 'This proposal is for illustrative purposes only and does not constitute a guarantee of savings. Calculations apply the full standard FICA rate (6.2% Social Security + 1.45% Medicare) and 2026 federal tax tables. Actual results may vary based on final enrollment, payroll data, and plan configuration. Example values shown use a standard $1,200/month medical premium — the most commonly selected plan tier. Your actual results will reflect the premiums entered.';

interface QuickProposalPageProps {
  groupId?: string;
}

const HYPOTHETICAL_TIERS: SalaryTier[] = [
  { label: 'Entry / Part-Time', level: 'entry', salaryMin: 25000, salaryMax: 45000, workforcePercent: 20 },
  { label: 'Mid-Level', level: 'mid', salaryMin: 45000, salaryMax: 75000, workforcePercent: 35 },
  { label: 'Senior', level: 'senior', salaryMin: 75000, salaryMax: 120000, workforcePercent: 30 },
  { label: 'Executive', level: 'executive', salaryMin: 120000, salaryMax: 250000, workforcePercent: 15 },
];

export function QuickProposalPage({ groupId = 'demo' }: QuickProposalPageProps) {
  useProposalCalculation();
  const store = useProposalStore((s) => s);
  const [activeSection, setActiveSection] = useState('company');
  const [showResults, setShowResults] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showHypotheticalConfirm, setShowHypotheticalConfirm] = useState(false);

  const handleFillHypothetical = useCallback(() => {
    store.setCompany({ name: 'Sample Industries, Inc.', employeeCount: 15000, payrollFrequency: 'biweekly' });
    store.setStates([{ stateCode: 'TX', stateName: 'Texas', stateTaxRate: 0, workforcePercent: 100 }]);
    store.setFilingStatus({ single: 35, married: 50, headOfHousehold: 15 });
    store.setTierCount(4);
    store.setTiers(HYPOTHETICAL_TIERS);
    store.setBenefits({
      enabled: true,
      healthcare: {
        enabled: true,
        participationRate: 85,
        medical: { premiums: { individual: 900, family: 2400 } },
        dental: { premiums: { individual: 60, family: 150 } },
        vision: { premiums: { individual: 20, family: 55 } },
      },
      retirement: { enabled: false, participationRate: 60, contributionRates: { entry: 4, mid: 6, senior: 8, executive: 10 } },
      hsa: { enabled: false, participationRate: 30, annualContribution: 1500 },
    });
    setShowHypotheticalConfirm(false);
    setShowResults(false);
  }, [store]);

  const stateTotal = store.states.reduce((s, st) => s + st.workforcePercent, 0);
  const filingTotal = store.filingStatus.single + store.filingStatus.married + store.filingStatus.headOfHousehold;
  const salaryTotal = store.tiers.reduce((s, t) => s + t.workforcePercent, 0);

  const isCompanyComplete = !!store.company.name && store.company.employeeCount > 0;
  const isStatesComplete = store.states.length > 0 && Math.abs(stateTotal - 100) < 0.5;
  const isFilingComplete = Math.abs(filingTotal - 100) < 0.5;
  const isSalaryComplete = store.tiers.length > 0 && store.tiers.every((t) => t.salaryMax > t.salaryMin) && Math.abs(salaryTotal - 100) < 0.5;
  const canGenerate = isCompanyComplete && isStatesComplete && isFilingComplete && isSalaryComplete;

  const sections = useMemo(
    () => [
      { id: 'company', label: 'Company Info', isComplete: isCompanyComplete },
      { id: 'states', label: 'States', isComplete: isStatesComplete },
      { id: 'filing', label: 'Filing Status', isComplete: isFilingComplete },
      { id: 'salary', label: 'Salary Tiers', isComplete: isSalaryComplete },
      { id: 'benefits', label: 'Benefits', isComplete: true },
      { id: 'results', label: 'Results', isComplete: showResults && store.result !== null },
    ],
    [isCompanyComplete, isStatesComplete, isFilingComplete, isSalaryComplete, showResults, store.result],
  );

  const handleNavigate = useCallback((id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const handleGenerateClick = useCallback(() => {
    setShowDisclaimer(true);
  }, []);

  const handleDisclaimerAccept = useCallback(() => {
    setShowDisclaimer(false);
    setShowResults(true);
    requestAnimationFrame(() => {
      document.getElementById('proposal-results')?.scrollIntoView({ behavior: 'instant', block: 'start' });
    });
  }, []);

  const handleDisclaimerBack = useCallback(() => {
    setShowDisclaimer(false);
  }, []);

  return (
    <GlassBackground>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div
            className="flex flex-1 items-center gap-2 rounded-lg px-4 py-2.5"
            style={{ background: 'rgba(0, 95, 120, 0.05)', border: '1px solid rgba(0, 95, 120, 0.15)' }}
          >
            <Info size={15} className="flex-shrink-0 text-accent" style={{ opacity: 0.7 }} />
            <p className="text-[12px] leading-snug text-text-tertiary">{DISCLAIMER_TEXT}</p>
          </div>
          <div className="flex flex-col items-end flex-shrink-0">
            <button
              onClick={() => setShowHypotheticalConfirm(true)}
              className="inline-flex items-center gap-2 rounded-[14px] px-4 py-2 text-[13px] font-semibold transition-colors whitespace-nowrap"
              style={{
                background: '#FFFFFF',
                border: '1px solid var(--color-synrgy-ink)',
                color: 'var(--color-synrgy-ink)',
              }}
            >
              <Sparkles size={14} style={{ color: 'var(--color-synrgy-teal)' }} />
              Use Hypothetical Example
            </button>
          </div>
        </div>

        <div className="flex gap-8">
          <div className="hidden lg:block">
            <ProgressSidebar sections={sections} activeSection={activeSection} onNavigate={handleNavigate} />
          </div>
          <div className="flex-1" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <HeroSection />
            <CompanyInfoSection />
            <StateDistributionSection />
            <FilingStatusSection />
            <SalaryInsightsSection />
            <BenefitsSection />

            {!showResults && (
              <div className="glass-primary text-center">
                <button
                  onClick={handleGenerateClick}
                  disabled={!canGenerate}
                  className="inline-flex items-center gap-2 transition-all"
                  style={{
                    background: canGenerate ? '#C95A38' : 'rgba(201, 90, 56, 0.3)',
                    color: '#FFFFFF',
                    borderRadius: 24,
                    padding: '16px 40px',
                    fontSize: 16,
                    fontWeight: 600,
                    border: 'none',
                    cursor: canGenerate ? 'pointer' : 'not-allowed',
                    opacity: canGenerate ? 1 : 0.4,
                    boxShadow: canGenerate ? '0 4px 16px rgba(201, 90, 56, 0.2)' : 'none',
                  }}
                  onMouseEnter={(e) => { if (canGenerate) e.currentTarget.style.boxShadow = '0 6px 24px rgba(201, 90, 56, 0.3)'; }}
                  onMouseLeave={(e) => { if (canGenerate) e.currentTarget.style.boxShadow = '0 4px 16px rgba(201, 90, 56, 0.2)'; }}
                >
                  Generate Proposal
                  <ArrowRight size={20} />
                </button>
                <p className="mt-4 text-[13px] text-text-tertiary">
                  {canGenerate
                    ? 'Benefits configuration is optional. Your proposal will include them if configured.'
                    : 'Complete all required sections above to generate your proposal.'}
                </p>
              </div>
            )}

            {showResults && (
              <motion.div
                id="proposal-results"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              >
                <ResultsSection groupId={groupId} />
              </motion.div>
            )}
          </div>
        </div>
      </div>
      <DisclaimerModal
        open={showDisclaimer}
        onAccept={handleDisclaimerAccept}
        onGoBack={handleDisclaimerBack}
      />

      {/* Hypothetical pre-fill confirmation */}
      <AnimatePresence>
        {showHypotheticalConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80]"
              style={{ background: 'rgba(0, 0, 0, 0.5)' }}
              onClick={() => setShowHypotheticalConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-[90] flex items-center justify-center p-4"
            >
              <div
                className="w-full text-center"
                style={{
                  maxWidth: 440,
                  background: '#FFFFFF',
                  border: '1px solid #D9CFC0',
                  borderRadius: 22,
                  padding: 32,
                  boxShadow: '0 16px 48px rgba(26, 58, 66, 0.15)',
                }}
              >
                <Sparkles size={28} style={{ color: 'var(--color-synrgy-teal)', margin: '0 auto' }} />
                <h2 className="text-[20px] font-semibold text-text-primary" style={{ marginTop: 16 }}>
                  Use Hypothetical Example?
                </h2>
                <p className="text-[14px] text-text-secondary" style={{ marginTop: 12, lineHeight: 1.6 }}>
                  Replace current values with a sample scenario?
                </p>
                <div className="mx-auto flex flex-col items-center" style={{ marginTop: 24, gap: 12, maxWidth: 300 }}>
                  <button
                    onClick={handleFillHypothetical}
                    className="w-full transition-all"
                    style={{
                      background: '#C95A38',
                      color: '#FFFFFF',
                      borderRadius: 24,
                      padding: '14px 24px',
                      fontSize: 16,
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    Yes, Fill Example Data
                  </button>
                  <button
                    onClick={() => setShowHypotheticalConfirm(false)}
                    className="text-[14px] text-text-tertiary hover:text-text-secondary hover:underline transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </GlassBackground>
  );
}
