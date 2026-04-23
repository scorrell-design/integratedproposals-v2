import { describe, it, expect } from 'vitest';
import { calculateEmployeeFICA, getFederalMarginalRate, estimatePreTaxDeductions } from '../fica-calculator';

describe('getFederalMarginalRate', () => {
  it('returns 10% for low-income single filer', () => {
    expect(getFederalMarginalRate(10000, 'single')).toBe(0.10);
  });

  it('returns 12% for $30k single filer', () => {
    expect(getFederalMarginalRate(30000, 'single')).toBe(0.12);
  });

  it('returns 22% for $80k single filer', () => {
    expect(getFederalMarginalRate(80000, 'single')).toBe(0.22);
  });

  it('returns 12% for $80k married filer (lower bracket)', () => {
    expect(getFederalMarginalRate(80000, 'married')).toBe(0.12);
  });

  it('returns 12% for $50k head of household', () => {
    expect(getFederalMarginalRate(50000, 'hoh')).toBe(0.12);
  });

  it('returns 37% for very high income', () => {
    expect(getFederalMarginalRate(1000000, 'single')).toBe(0.37);
  });
});

describe('calculateEmployeeFICA', () => {
  it('calculates positive impact for a typical employee', () => {
    const result = calculateEmployeeFICA({
      salary: 60000,
      stateCode: 'TX',
      filingStatus: 'single',
      preTaxDeductions: 5000,
      adminFeeAnnual: 420,
    });

    expect(result.employerFICASavings).toBeGreaterThan(0);
    expect(result.employeeTaxSavings).toBeGreaterThan(0);
    expect(result.isQualified).toBe(true);
  });

  it('returns zero employer savings with zero deductions', () => {
    const result = calculateEmployeeFICA({
      salary: 60000,
      stateCode: 'TX',
      filingStatus: 'single',
      preTaxDeductions: 0,
      adminFeeAnnual: 420,
    });

    expect(result.employerFICASavings).toBe(0);
    expect(result.employeeTaxSavings).toBe(0);
    expect(result.netEmployeeImpact).toBe(-420);
    expect(result.isPositivelyImpacted).toBe(false);
  });

  it('always uses full FICA rate of 7.65%', () => {
    const result = calculateEmployeeFICA({
      salary: 100000,
      stateCode: 'TX',
      filingStatus: 'single',
      preTaxDeductions: 10000,
      adminFeeAnnual: 420,
    });

    expect(result.employerFICASavings).toBeCloseTo(10000 * 0.0765, 0);
  });

  it('produces higher employee savings in high-tax states', () => {
    const texas = calculateEmployeeFICA({
      salary: 60000,
      stateCode: 'TX',
      filingStatus: 'single',
      preTaxDeductions: 5000,
      adminFeeAnnual: 420,
    });

    const california = calculateEmployeeFICA({
      salary: 60000,
      stateCode: 'CA',
      filingStatus: 'single',
      preTaxDeductions: 5000,
      adminFeeAnnual: 420,
    });

    expect(california.employeeTaxSavings).toBeGreaterThan(texas.employeeTaxSavings);
    expect(california.employerFICASavings).toBe(texas.employerFICASavings);
  });

  it('correctly calculates employer FICA at 7.65%', () => {
    const result = calculateEmployeeFICA({
      salary: 100000,
      stateCode: 'TX',
      filingStatus: 'single',
      preTaxDeductions: 10000,
      adminFeeAnnual: 420,
    });

    expect(result.employerFICASavings).toBeCloseTo(10000 * 0.0765, 0);
  });

  it('handles zero salary gracefully', () => {
    const result = calculateEmployeeFICA({
      salary: 0,
      stateCode: 'TX',
      filingStatus: 'single',
      preTaxDeductions: 0,
      adminFeeAnnual: 420,
    });

    expect(result.employerFICASavings).toBe(0);
    expect(result.isQualified).toBe(false);
  });
});

const ZERO_BENEFITS = {
  medicalParticipation: 0,
  medicalPremiumAnnual: 0,
  dentalParticipation: 0,
  dentalPremiumAnnual: 0,
  visionParticipation: 0,
  visionPremiumAnnual: 0,
  retirementParticipation: 0,
  retirementRate: 0,
  hsaParticipation: 0,
  hsaAnnual: 0,
};

describe('estimatePreTaxDeductions', () => {
  it('returns default deduction when no benefits configured', () => {
    const deduction = estimatePreTaxDeductions(60000, 'mid', ZERO_BENEFITS);
    expect(deduction).toBe(60000 * 0.10);
  });

  it('includes medical premium when participation > 0', () => {
    const deduction = estimatePreTaxDeductions(60000, 'mid', {
      ...ZERO_BENEFITS,
      medicalParticipation: 100,
      medicalPremiumAnnual: 6000,
    });
    expect(deduction).toBe(6000);
  });

  it('scales deduction by participation rate', () => {
    const full = estimatePreTaxDeductions(60000, 'mid', {
      ...ZERO_BENEFITS,
      medicalParticipation: 100,
      medicalPremiumAnnual: 6000,
    });

    const half = estimatePreTaxDeductions(60000, 'mid', {
      ...ZERO_BENEFITS,
      medicalParticipation: 50,
      medicalPremiumAnnual: 6000,
    });

    expect(half).toBe(full / 2);
  });

  it('sums all three healthcare sub-benefits independently', () => {
    const deduction = estimatePreTaxDeductions(60000, 'mid', {
      ...ZERO_BENEFITS,
      medicalParticipation: 100,
      medicalPremiumAnnual: 6000,
      dentalParticipation: 50,
      dentalPremiumAnnual: 1200,
      visionParticipation: 80,
      visionPremiumAnnual: 600,
    });
    expect(deduction).toBe(6000 + 600 + 480);
  });
});
