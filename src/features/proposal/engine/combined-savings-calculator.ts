import { FICA_RATES } from '@/config/fica-rates';

export const DEFAULT_FEDERAL_TAX_BRACKET = 0.22;

export interface CombinedSavingsInput {
  totalAnnualPreTaxDeductions: number;
  avgFederalTaxBracket?: number;
}

export interface CombinedSavingsOutput {
  employerFICASavings: number;
  employeeFICASavings: number;
  employeeFederalTaxSavings: number;
  combinedTotalSavings: number;
  perEmployeeCombined: number;
}

export function calculateCombinedSavings(
  input: CombinedSavingsInput,
  qualifiedEmployeeCount: number,
): CombinedSavingsOutput {
  const fedRate = input.avgFederalTaxBracket ?? DEFAULT_FEDERAL_TAX_BRACKET;
  const ficaRate = FICA_RATES.combined;

  const employerFICA = input.totalAnnualPreTaxDeductions * ficaRate;
  const employeeFICA = input.totalAnnualPreTaxDeductions * ficaRate;
  const employeeFed = input.totalAnnualPreTaxDeductions * fedRate;
  const total = employerFICA + employeeFICA + employeeFed;

  return {
    employerFICASavings: Math.round(employerFICA),
    employeeFICASavings: Math.round(employeeFICA),
    employeeFederalTaxSavings: Math.round(employeeFed),
    combinedTotalSavings: Math.round(total),
    perEmployeeCombined: qualifiedEmployeeCount > 0 ? Math.round(total / qualifiedEmployeeCount) : 0,
  };
}
