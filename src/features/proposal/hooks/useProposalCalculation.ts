import { useEffect, useRef, useCallback } from 'react';
import { useProposalStore } from '../store/proposal.store';
import { calculateTierResult, estimatePreTaxDeductions, calculateSavingsRange, calculateEmployerAnnualSavings } from '../engine';
import { FICA_RATES } from '@/config/fica-rates';
import { ADMIN_FEE_ANNUAL } from '@/config/fica-rates';
import type { ProposalResult, TierResult } from '../types/proposal.types';

const DEBOUNCE_MS = 800;

export function useProposalCalculation() {
  const store = useProposalStore((s) => s);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const runCalculation = useCallback(() => {
    const { company, states, filingStatus, tiers, benefits } = useProposalStore.getState();

    if (!company.employeeCount || tiers.length === 0 || states.length === 0) {
      useProposalStore.getState().setResult(null);
      return;
    }

    useProposalStore.getState().setIsCalculating(true);

    const stateDistribution = states.map((s) => ({
      stateCode: s.stateCode,
      percent: s.workforcePercent,
    }));

    const hcEnabled = benefits.enabled && benefits.healthcare.enabled;
    const hc = benefits.healthcare;

    // --- Employer Annual Savings: hard-rule formula ---
    // Single healthcare participation rate drives all three sub-benefits
    let directEmployerSavings = 0;
    if (hcEnabled) {
      const medAvg = (hc.medical.premiums.individual + hc.medical.premiums.family) / 2;
      const denAvg = (hc.dental.premiums.individual + hc.dental.premiums.family) / 2;
      const visAvg = (hc.vision.premiums.individual + hc.vision.premiums.family) / 2;
      const rate = hc.participationRate;

      directEmployerSavings += calculateEmployerAnnualSavings(company.employeeCount, medAvg, rate);
      directEmployerSavings += calculateEmployerAnnualSavings(company.employeeCount, denAvg, rate);
      directEmployerSavings += calculateEmployerAnnualSavings(company.employeeCount, visAvg, rate);
    }

    // --- Tier-level calculations for paycheck comparison ---
    const tierResults: TierResult[] = [];
    let totalQualified = 0;
    let totalPositive = 0;
    let totalEmployeeSavings = 0;

    for (const tier of tiers) {
      const employeeCount = Math.round(company.employeeCount * (tier.workforcePercent / 100));
      const avgSalary = (tier.salaryMin + tier.salaryMax) / 2;

      const medAvg = (hc.medical.premiums.individual + hc.medical.premiums.family) / 2;
      const denAvg = (hc.dental.premiums.individual + hc.dental.premiums.family) / 2;
      const visAvg = (hc.vision.premiums.individual + hc.vision.premiums.family) / 2;

      const retirementRate = benefits.enabled && benefits.retirement.enabled
        ? (benefits.retirement.contributionRates[tier.level] ?? 6)
        : 0;
      const hsaAnnual = benefits.enabled && benefits.hsa.enabled
        ? benefits.hsa.annualContribution
        : 0;

      const hcRate = hcEnabled ? hc.participationRate : 0;
      const preTaxDeduction = estimatePreTaxDeductions(avgSalary, tier.level, {
        medicalParticipation: hcRate,
        medicalPremiumAnnual: medAvg * 12,
        dentalParticipation: hcRate,
        dentalPremiumAnnual: denAvg * 12,
        visionParticipation: hcRate,
        visionPremiumAnnual: visAvg * 12,
        retirementParticipation: benefits.enabled && benefits.retirement.enabled ? benefits.retirement.participationRate : 0,
        retirementRate,
        hsaParticipation: benefits.enabled && benefits.hsa.enabled ? benefits.hsa.participationRate : 0,
        hsaAnnual,
      });

      const result = calculateTierResult(
        tier.label,
        employeeCount,
        avgSalary,
        stateDistribution,
        filingStatus,
        preTaxDeduction,
      );

      tierResults.push({
        tier: tier.label,
        employeeCount,
        avgSalary,
        avgPreTaxDeduction: preTaxDeduction,
        ficaSavingsPerEmployee: result.ficaSavingsPerEmployee,
        netImpactPerEmployee: result.netImpactPerEmployee,
      });

      totalQualified += result.qualifiedCount;
      totalPositive += result.positiveCount;
      totalEmployeeSavings += result.netImpactPerEmployee * employeeCount;
    }

    const employerAnnualFICASavings = Math.round(directEmployerSavings);
    const totalAdminFee = ADMIN_FEE_ANNUAL * company.employeeCount;
    const netAnnualBenefit = employerAnnualFICASavings - totalAdminFee;
    const avgEmployeeSavings = company.employeeCount > 0 ? totalEmployeeSavings / company.employeeCount : 0;
    const savingsRange = calculateSavingsRange(employerAnnualFICASavings, 'quick_proposal');

    if (import.meta.env.DEV && hcEnabled) {
      const medAvg = (hc.medical.premiums.individual + hc.medical.premiums.family) / 2;
      const denAvg = (hc.dental.premiums.individual + hc.dental.premiums.family) / 2;
      const visAvg = (hc.vision.premiums.individual + hc.vision.premiums.family) / 2;
      const r = hc.participationRate / 100;
      const expectedSavings =
        company.employeeCount * r * medAvg * 12 * FICA_RATES.combined +
        company.employeeCount * r * denAvg * 12 * FICA_RATES.combined +
        company.employeeCount * r * visAvg * 12 * FICA_RATES.combined;
      console.assert(
        Math.abs(employerAnnualFICASavings - Math.round(expectedSavings)) < 2,
        `KPI mismatch: got ${employerAnnualFICASavings}, expected ~${Math.round(expectedSavings)}`,
      );
    }

    const proposalResult: ProposalResult = {
      employerAnnualFICASavings,
      avgEmployeeAnnualSavings: Math.round(avgEmployeeSavings),
      qualifiedEmployees: totalQualified,
      totalEmployees: company.employeeCount,
      positivelyImpactedCount: totalPositive,
      positivelyImpactedPercent: company.employeeCount > 0 ? Math.round((totalPositive / company.employeeCount) * 100) : 0,
      tierResults,
      savingsRange,
      netAnnualBenefit: Math.round(netAnnualBenefit),
      totalAdminFee: Math.round(totalAdminFee),
    };

    useProposalStore.getState().setResult(proposalResult);
    useProposalStore.getState().setIsCalculating(false);
  }, []);

  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(runCalculation, DEBOUNCE_MS);
    return () => clearTimeout(timerRef.current);
  }, [
    store.company,
    store.states,
    store.filingStatus,
    store.tiers,
    store.benefits,
    runCalculation,
  ]);

  return { result: store.result, isCalculating: store.isCalculating };
}
