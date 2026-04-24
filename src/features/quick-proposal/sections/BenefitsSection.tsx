import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, RotateCcw } from 'lucide-react';
import { useProposalStore } from '@/features/proposal/store/proposal.store';
import { SectionCard } from '@/features/proposal/components/shared/SectionCard';
import { PercentInput } from '@/features/proposal/components/shared/PercentInput';
import { DollarInput } from '@/features/proposal/components/shared/DollarInput';

const BENEFIT_TABS = ['Healthcare', 'Retirement', 'HSA'] as const;
type BenefitTab = typeof BENEFIT_TABS[number];

const HC_DEFAULTS = {
  participationRate: 75,
  medical: { premiums: { individual: 600, family: 1800 } },
  dental: { premiums: { individual: 45, family: 85 } },
  vision: { premiums: { individual: 15, family: 40 } },
};

export function BenefitsSection() {
  const { benefits, setBenefits } = useProposalStore((s) => s);
  const [activeTab, setActiveTab] = useState<BenefitTab>('Healthcare');
  const [showRetirementTiers, setShowRetirementTiers] = useState(true);

  const handleResetToDefaults = useCallback(() => {
    setBenefits({
      healthcare: { ...benefits.healthcare, ...HC_DEFAULTS },
      retirement: {
        ...benefits.retirement,
        participationRate: 60,
        contributionRates: { entry: 4, mid: 6, senior: 8, executive: 10 },
      },
      hsa: { ...benefits.hsa, participationRate: 30 },
    });
  }, [benefits, setBenefits]);

  const updateHcPremium = useCallback(
    (benefit: 'medical' | 'dental' | 'vision', field: 'individual' | 'family', val: number) => {
      const cur = benefits.healthcare[benefit];
      setBenefits({
        healthcare: { ...benefits.healthcare, [benefit]: { ...cur, premiums: { ...cur.premiums, [field]: val } } },
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

        {/* Healthcare Tab */}
        {activeTab === 'Healthcare' && (
          <div className="glass-secondary !rounded-[14px]" style={{ padding: 24 }}>
            <div className="flex items-center gap-3" style={{ marginBottom: 20 }}>
              <span className="text-[14px] font-medium text-text-primary">Participation Rate</span>
              <PercentInput
                value={benefits.healthcare.participationRate}
                onChange={(val) => setBenefits({ healthcare: { ...benefits.healthcare, participationRate: val } })}
              />
            </div>

            <div style={{ height: 1, background: '#D9CFC0', marginBottom: 16 }} />

            <div style={{ maxWidth: 520 }}>
              <div
                className="grid items-end"
                style={{ gridTemplateColumns: '100px 120px 120px', gap: '0 16px', marginBottom: 8 }}
              >
                <div />
                <div className="text-[11px] font-semibold text-text-secondary uppercase" style={{ letterSpacing: '0.5px' }}>
                  Individual
                </div>
                <div className="text-[11px] font-semibold text-text-secondary uppercase" style={{ letterSpacing: '0.5px' }}>
                  Family
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {(['medical', 'dental', 'vision'] as const).map((benefit) => (
                  <div
                    key={benefit}
                    className="grid items-center"
                    style={{ gridTemplateColumns: '100px 120px 120px', gap: '0 16px' }}
                  >
                    <div className="text-[14px] font-medium text-text-primary capitalize">{benefit}</div>
                    <DollarInput
                      value={benefits.healthcare[benefit].premiums.individual}
                      onChange={(v) => updateHcPremium(benefit, 'individual', v)}
                    />
                    <DollarInput
                      value={benefits.healthcare[benefit].premiums.family}
                      onChange={(v) => updateHcPremium(benefit, 'family', v)}
                    />
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-text-tertiary" style={{ marginTop: 12 }}>
                Monthly premium per employee
              </p>
            </div>
          </div>
        )}

        {/* Retirement Tab */}
        {activeTab === 'Retirement' && (
          <div style={{ maxWidth: 520 }}>
            <div className="flex items-center gap-3" style={{ marginBottom: 16 }}>
              <span className="text-[14px] font-medium text-text-primary">Participation Rate</span>
              <PercentInput
                value={benefits.retirement.participationRate}
                onChange={(val) => setBenefits({ retirement: { ...benefits.retirement, participationRate: val } })}
              />
            </div>

            <button
              onClick={() => setShowRetirementTiers(!showRetirementTiers)}
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-text-secondary hover:text-text-primary transition-colors"
              style={{ marginBottom: 12 }}
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
                    <div className="grid grid-cols-4" style={{ gap: 12 }}>
                      {(['entry', 'mid', 'senior', 'executive'] as const).map((tier) => (
                        <div key={tier} className="text-center">
                          <p className="text-[12px] font-medium text-text-secondary capitalize" style={{ marginBottom: 6 }}>{tier}</p>
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

        {/* HSA Tab */}
        {activeTab === 'HSA' && (
          <div style={{ maxWidth: 520 }}>
            <div className="flex items-center gap-3" style={{ marginBottom: 12 }}>
              <span className="text-[14px] font-medium text-text-primary">Participation Rate</span>
              <PercentInput
                value={benefits.hsa.participationRate}
                onChange={(val) => setBenefits({ hsa: { ...benefits.hsa, participationRate: val } })}
              />
            </div>
            <p className="text-[12px] text-text-tertiary italic">
              Savings estimate will use national average HSA contribution data.
            </p>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
