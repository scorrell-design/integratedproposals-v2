import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, RotateCcw } from 'lucide-react';
import { useProposalStore } from '@/features/proposal/store/proposal.store';
import { SectionCard } from '@/features/proposal/components/shared/SectionCard';
import { PercentInput } from '@/features/proposal/components/shared/PercentInput';
import { DollarInput } from '@/features/proposal/components/shared/DollarInput';

const BENEFIT_TABS = ['Healthcare', 'Retirement', 'HSA'] as const;
type BenefitTab = typeof BENEFIT_TABS[number];

const DEFAULT_BENEFITS_VALUES = {
  healthcare: {
    participationRate: 75,
    premiums: {
      medical: { individual: 200, family: 775 },
      dental: { individual: 35, family: 85 },
      vision: { individual: 15, family: 40 },
    },
  },
  retirement: { participationRate: 60, contributionRates: { entry: 4, mid: 6, senior: 8, executive: 10 } },
  hsa: { participationRate: 30, annualContribution: 1500 },
};

export function BenefitsSection() {
  const { benefits, setBenefits } = useProposalStore((s) => s);
  const [activeTab, setActiveTab] = useState<BenefitTab>('Healthcare');
  const [showRetirementTiers, setShowRetirementTiers] = useState(true);

  const handleResetToDefaults = useCallback(() => {
    setBenefits({
      healthcare: {
        ...benefits.healthcare,
        participationRate: DEFAULT_BENEFITS_VALUES.healthcare.participationRate,
        premiums: DEFAULT_BENEFITS_VALUES.healthcare.premiums,
      },
      retirement: {
        ...benefits.retirement,
        participationRate: DEFAULT_BENEFITS_VALUES.retirement.participationRate,
        contributionRates: DEFAULT_BENEFITS_VALUES.retirement.contributionRates,
      },
      hsa: {
        ...benefits.hsa,
        participationRate: DEFAULT_BENEFITS_VALUES.hsa.participationRate,
      },
    });
  }, [benefits, setBenefits]);

  const updatePremium = useCallback(
    (type: 'medical' | 'dental' | 'vision', side: 'individual' | 'family', val: number) => {
      setBenefits({
        healthcare: {
          ...benefits.healthcare,
          premiums: {
            ...benefits.healthcare.premiums,
            [type]: {
              ...benefits.healthcare.premiums[type],
              [side]: val,
            },
          },
        },
      });
    },
    [benefits.healthcare, setBenefits],
  );

  return (
    <SectionCard id="benefits" title="Benefits Configuration" subtitle="Configure pre-tax benefit details for more accurate projections">
      <div className="flex items-center justify-between mb-4">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium text-text-secondary"
          style={{ background: '#E8F1F4', border: '1px solid rgba(0, 95, 120, 0.2)' }}
        >
          Using preset values based on U.S. national averages
        </span>
        <button
          onClick={handleResetToDefaults}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium text-text-secondary hover:text-text-primary transition-colors"
          style={{ background: '#FAF5EC', border: '1px solid #D9CFC0' }}
        >
          <RotateCcw size={13} />
          Reset to Industry Average
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setBenefits({ enabled: !benefits.enabled })}
          className="relative h-6 w-11 rounded-full transition-colors flex-shrink-0"
          style={{ background: benefits.enabled ? 'var(--color-accent)' : '#D9CFC0' }}
        >
          <span
            className="absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
            style={{ transform: benefits.enabled ? 'translateX(22px)' : 'translateX(2px)' }}
          />
        </button>
        <span className="text-[14px] font-medium text-text-secondary">
          Include benefits in calculation
        </span>
      </div>

      {!benefits.enabled && (
        <p className="text-[13px] text-text-tertiary" style={{ marginTop: 12 }}>
          Proposal will use FICA savings only. Toggle on to include benefits for a more detailed estimate.
        </p>
      )}

      <div
        style={{
          marginTop: 24,
          opacity: benefits.enabled ? 1 : 0.3,
          pointerEvents: benefits.enabled ? 'auto' : 'none',
          transition: 'opacity 300ms',
        }}
      >
        <div className="glass-secondary inline-flex !p-1 !rounded-[14px] flex-wrap" style={{ marginBottom: 24 }}>
          {BENEFIT_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-[10px] px-4 py-1.5 text-[14px] font-medium transition-all
                ${activeTab === tab
                  ? 'bg-white text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── Healthcare Tab ── */}
        {activeTab === 'Healthcare' && (
          <div>
            <div className="flex items-center gap-4 mb-6" style={{ maxWidth: 400 }}>
              <span className="text-[14px] font-medium text-text-primary">Participation Rate</span>
              <PercentInput
                value={benefits.healthcare.participationRate}
                onChange={(val) => setBenefits({ healthcare: { ...benefits.healthcare, participationRate: val } })}
              />
            </div>

            <div className="glass-secondary !rounded-[14px]">
              <div className="grid grid-cols-[1fr_1fr_1fr] gap-x-4 gap-y-0">
                {/* Headers */}
                <div />
                <div className="text-center text-[12px] font-semibold text-text-secondary uppercase tracking-wide pb-3">
                  Individual
                </div>
                <div className="text-center text-[12px] font-semibold text-text-secondary uppercase tracking-wide pb-3">
                  Family
                </div>

                {/* Medical */}
                <div className="flex items-center text-[14px] font-medium text-text-primary py-2">Medical</div>
                <div className="flex flex-col items-center py-2">
                  <DollarInput
                    value={benefits.healthcare.premiums.medical.individual}
                    onChange={(v) => updatePremium('medical', 'individual', v)}
                  />
                  <span className="text-[11px] text-text-tertiary mt-1">Monthly premium per employee</span>
                </div>
                <div className="flex flex-col items-center py-2">
                  <DollarInput
                    value={benefits.healthcare.premiums.medical.family}
                    onChange={(v) => updatePremium('medical', 'family', v)}
                  />
                  <span className="text-[11px] text-text-tertiary mt-1">Monthly premium per employee</span>
                </div>

                {/* Dental */}
                <div className="flex items-center text-[14px] font-medium text-text-primary py-2">Dental</div>
                <div className="flex flex-col items-center py-2">
                  <DollarInput
                    value={benefits.healthcare.premiums.dental.individual}
                    onChange={(v) => updatePremium('dental', 'individual', v)}
                  />
                  <span className="text-[11px] text-text-tertiary mt-1">Monthly premium per employee</span>
                </div>
                <div className="flex flex-col items-center py-2">
                  <DollarInput
                    value={benefits.healthcare.premiums.dental.family}
                    onChange={(v) => updatePremium('dental', 'family', v)}
                  />
                  <span className="text-[11px] text-text-tertiary mt-1">Monthly premium per employee</span>
                </div>

                {/* Vision */}
                <div className="flex items-center text-[14px] font-medium text-text-primary py-2">Vision</div>
                <div className="flex flex-col items-center py-2">
                  <DollarInput
                    value={benefits.healthcare.premiums.vision.individual}
                    onChange={(v) => updatePremium('vision', 'individual', v)}
                  />
                  <span className="text-[11px] text-text-tertiary mt-1">Monthly premium per employee</span>
                </div>
                <div className="flex flex-col items-center py-2">
                  <DollarInput
                    value={benefits.healthcare.premiums.vision.family}
                    onChange={(v) => updatePremium('vision', 'family', v)}
                  />
                  <span className="text-[11px] text-text-tertiary mt-1">Monthly premium per employee</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Retirement Tab ── */}
        {activeTab === 'Retirement' && (
          <div>
            <div className="flex items-center gap-4 mb-6" style={{ maxWidth: 400 }}>
              <span className="text-[14px] font-medium text-text-primary">Participation Rate</span>
              <PercentInput
                value={benefits.retirement.participationRate}
                onChange={(val) => setBenefits({ retirement: { ...benefits.retirement, participationRate: val } })}
              />
            </div>

            <button
              onClick={() => setShowRetirementTiers(!showRetirementTiers)}
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-text-secondary hover:text-text-primary transition-colors mb-4"
            >
              <motion.span animate={{ rotate: showRetirementTiers ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown size={14} className="text-current" />
              </motion.span>
              Contribution Rates by Tier
            </button>

            <AnimatePresence>
              {showRetirementTiers && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="glass-secondary !rounded-[14px]">
                    <div className="grid grid-cols-4 gap-4">
                      {(['entry', 'mid', 'senior', 'executive'] as const).map((tier) => (
                        <div key={tier} className="text-center">
                          <p className="text-[12px] font-medium text-text-secondary capitalize mb-2">{tier}</p>
                          <PercentInput
                            value={benefits.retirement.contributionRates[tier]}
                            onChange={(val) =>
                              setBenefits({
                                retirement: {
                                  ...benefits.retirement,
                                  contributionRates: {
                                    ...benefits.retirement.contributionRates,
                                    [tier]: val,
                                  },
                                },
                              })
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── HSA Tab ── */}
        {activeTab === 'HSA' && (
          <div>
            <div className="flex items-center gap-4" style={{ maxWidth: 400, marginBottom: 24 }}>
              <span className="text-[14px] font-medium text-text-primary">Participation Rate</span>
              <PercentInput
                value={benefits.hsa.participationRate}
                onChange={(val) => setBenefits({ hsa: { ...benefits.hsa, participationRate: val } })}
              />
            </div>
            <p className="text-[12px] text-text-tertiary italic" style={{ marginTop: 8 }}>
              Savings estimate will use national average HSA contribution data.
            </p>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
