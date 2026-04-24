/**
 * Canonical 35-column field alias table for census/payroll file auto-detection.
 * Keys are canonical field names; values are lowercase, normalized aliases.
 * Normalization: lowercase, strip whitespace/underscores/parens before matching.
 */

export type FieldClassification = 'required' | 'optional' | 'conditional';

export interface CanonicalFieldDef {
  canonical: string;
  label: string;
  classification: FieldClassification;
  group: 'employeePay' | 'taxFiling' | 'benefitsDeductions' | 'stateSpecific';
  aliases: string[];
  conditionalNote?: string;
}

export const CANONICAL_FIELDS: CanonicalFieldDef[] = [
  // ── Group 1: Employee & Pay ──
  { canonical: 'FirstName', label: 'First Name', classification: 'required', group: 'employeePay',
    aliases: ['firstname', 'first name', 'first', 'fname', 'given name'] },
  { canonical: 'LastName', label: 'Last Name', classification: 'required', group: 'employeePay',
    aliases: ['lastname', 'last name', 'last', 'lname', 'surname', 'family name'] },
  { canonical: 'EmployeeID', label: 'Employee ID', classification: 'required', group: 'employeePay',
    aliases: ['employeeid', 'employee id', 'emp id', 'empid', 'id', 'employee number', 'emp#', 'ee id'] },
  { canonical: 'GrossWagesPPP', label: 'Gross Wages Per Pay Period', classification: 'required', group: 'employeePay',
    aliases: ['grosswagesppp', 'gross wages ppp', 'gross wages per pay period', 'gross pay', 'gross wages', 'gross', 'wages', 'salary per period', 'ppp', 'salary', 'compensation', 'pay', 'annual salary', 'base pay', 'rate of pay'] },
  { canonical: 'PaySchedule', label: 'Pay Schedule', classification: 'required', group: 'employeePay',
    aliases: ['payschedule', 'pay schedule', 'pay frequency', 'frequency', 'pay cycle', 'payroll frequency'] },
  { canonical: 'State', label: 'State (Residence)', classification: 'required', group: 'employeePay',
    aliases: ['state', 'residence state', 'home state', 'state of residence', 'state code'] },
  { canonical: 'WorkedInState', label: 'Worked-In State', classification: 'required', group: 'employeePay',
    aliases: ['workedinstate', 'worked in state', 'work state', 'work location state', 'state of work', 'employment state', 'worksite state'] },

  // ── Group 2: Tax Filing ──
  { canonical: 'FedMaritalStatus', label: 'Federal Marital Status', classification: 'required', group: 'taxFiling',
    aliases: ['fedmaritalstatus', 'fed marital status', 'federal marital status', 'filing status', 'fed filing status', 'marital status', 'tax status'] },
  { canonical: 'Fed2020W4', label: 'Fed 2020 W-4', classification: 'required', group: 'taxFiling',
    aliases: ['fed2020w4', 'fed 2020 w4', '2020 w4', 'new w4', 'w4 2020'] },
  { canonical: 'FedAllowances_2019W4', label: 'Fed Allowances (2019 W-4)', classification: 'conditional', group: 'taxFiling',
    aliases: ['fedallowances 2019w4', 'fed allowances 2019 w4', 'allowances', 'w4 allowances', '2019 w4 allowances', 'fedallowances'],
    conditionalNote: 'Populated only when Fed2020W4 = N' },
  { canonical: '2020W4FedDepAmt', label: '2020 W-4 Dependent Amount', classification: 'conditional', group: 'taxFiling',
    aliases: ['2020w4feddepamt', '2020 w4 dependent amount', 'w4 dep amount', 'dependent amount', 'dep amt'],
    conditionalNote: 'Populated only when Fed2020W4 = Y' },
  { canonical: '2020W4Box2c', label: '2020 W-4 Box 2c', classification: 'conditional', group: 'taxFiling',
    aliases: ['2020w4box2c', 'w4 box 2c', 'box 2c', 'two jobs'],
    conditionalNote: 'Populated only when Fed2020W4 = Y' },
  { canonical: 'StateMaritalStatus', label: 'State Marital Status', classification: 'optional', group: 'taxFiling',
    aliases: ['statemaritalstatus', 'state marital status', 'state filing status'] },
  { canonical: 'StateExemptions', label: 'State Exemptions', classification: 'optional', group: 'taxFiling',
    aliases: ['stateexemptions', 'state exemptions', 'state allowances'] },
  { canonical: 'StateDepExemptions_ALGALA', label: 'State Dep. Exemptions (AL/GA/LA)', classification: 'conditional', group: 'taxFiling',
    aliases: ['statedepexemptions algala', 'state dep exemptions al ga la', 'dep exemptions', 'state dependent exemptions', 'statedepexemptions'],
    conditionalNote: 'Only expected when State or WorkedInState is AL, GA, or LA' },
  { canonical: 'ExemptFromMedicare', label: 'Exempt from Medicare', classification: 'optional', group: 'taxFiling',
    aliases: ['exemptfrommedicare', 'medicare exempt', 'exempt from medicare'] },
  { canonical: 'ExemptFromSS', label: 'Exempt from Social Security', classification: 'optional', group: 'taxFiling',
    aliases: ['exemptfromss', 'ss exempt', 'exempt from ss', 'exempt from social security'] },
  { canonical: 'AddTaxWithholding', label: 'Additional Tax Withholding', classification: 'optional', group: 'taxFiling',
    aliases: ['addtaxwithholding', 'add tax withholding', 'additional withholding', 'extra withholding'] },

  // ── Group 3: Benefits & Deductions ──
  { canonical: 'EmployeeContMajorMed', label: 'Major Medical Contribution', classification: 'optional', group: 'benefitsDeductions',
    aliases: ['employeecontmajormed', 'employee cont major med', 'medical contribution', 'medical premium', 'health premium', 'major medical', 'employee contribution major medical', 'health insurance premium', 'health ins'] },
  { canonical: 'EmployeeContDen', label: 'Dental Contribution', classification: 'optional', group: 'benefitsDeductions',
    aliases: ['employeecontden', 'employee cont den', 'dental contribution', 'dental premium'] },
  { canonical: 'EmployeeContVis', label: 'Vision Contribution', classification: 'optional', group: 'benefitsDeductions',
    aliases: ['employeecontvis', 'employee cont vis', 'vision contribution', 'vision premium'] },
  { canonical: 'AdditionalPreTaxDedPP', label: 'Additional Pre-Tax Deductions', classification: 'optional', group: 'benefitsDeductions',
    aliases: ['additionalpretaxdedpp', 'additional pre tax ded pp', 'pretax deduction', 'other pretax', 'additional pretax', 'pre tax ded'] },
  { canonical: 'PostTaxDedPP', label: 'Post-Tax Deductions', classification: 'optional', group: 'benefitsDeductions',
    aliases: ['posttaxdedpp', 'post tax ded pp', 'posttax deduction', 'after tax deduction'] },
  { canonical: '401KCont', label: '401(k) Contribution', classification: 'optional', group: 'benefitsDeductions',
    aliases: ['401kcont', '401k cont', '401k', '401(k)', '401k contribution', 'traditional 401k'] },
  { canonical: 'RothCont', label: 'Roth 401(k) Contribution', classification: 'optional', group: 'benefitsDeductions',
    aliases: ['rothcont', 'roth cont', 'roth', 'roth 401k', 'roth contribution'] },
  { canonical: 'RetirementDeferral', label: 'Retirement Deferral', classification: 'optional', group: 'benefitsDeductions',
    aliases: ['retirementdeferral', 'retirement deferral', 'deferral'] },
  { canonical: '401KCatchupCont', label: '401(k) Catch-Up', classification: 'optional', group: 'benefitsDeductions',
    aliases: ['401kcatchupcont', '401k catchup', 'catchup 401k', '401k catch up'] },
  { canonical: 'RothCatchupCont', label: 'Roth Catch-Up', classification: 'optional', group: 'benefitsDeductions',
    aliases: ['rothcatchupcont', 'roth catchup', 'catchup roth', 'roth catch up'] },

  // ── Group 4: Address (optional) ──
  { canonical: 'Address1', label: 'Address Line 1', classification: 'optional', group: 'employeePay',
    aliases: ['address1', 'address 1', 'address line 1', 'street address', 'street'] },
  { canonical: 'Address2', label: 'Address Line 2', classification: 'optional', group: 'employeePay',
    aliases: ['address2', 'address 2', 'address line 2', 'apt', 'suite', 'unit'] },
  { canonical: 'City', label: 'City', classification: 'optional', group: 'employeePay',
    aliases: ['city', 'town'] },
  { canonical: 'Zip', label: 'Zip Code', classification: 'optional', group: 'employeePay',
    aliases: ['zip', 'zip code', 'zipcode', 'postal code', 'postcode'] },

  // ── Group 5: State-Specific ──
  { canonical: 'WithholdingRate_AZ', label: 'Withholding Rate (AZ)', classification: 'conditional', group: 'stateSpecific',
    aliases: ['withholdingrate az', 'az withholding rate', 'arizona withholding rate', 'withholdingrateaz'],
    conditionalNote: 'Only expected when State or WorkedInState is AZ' },
  { canonical: 'ExemptionAmt_MS', label: 'Exemption Amount (MS)', classification: 'conditional', group: 'stateSpecific',
    aliases: ['exemptionamt ms', 'ms exemption amount', 'mississippi exemption', 'exemptionamtms'],
    conditionalNote: 'Only expected when State or WorkedInState is MS' },
  { canonical: 'SpouseWorks_MO', label: 'Spouse Works (MO)', classification: 'conditional', group: 'stateSpecific',
    aliases: ['spouseworks mo', 'mo spouse works', 'missouri spouse works', 'spouseworksmo'],
    conditionalNote: 'Only expected when State or WorkedInState is MO' },
];

export function normalizeForAlias(s: string): string {
  return s.toLowerCase().replace(/[_()]/g, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Try to match a raw column header to a canonical field name.
 * Returns the canonical name or null.
 */
export function matchCanonical(rawHeader: string): string | null {
  const normalized = normalizeForAlias(rawHeader);

  // Exact canonical name match (case-insensitive)
  for (const def of CANONICAL_FIELDS) {
    if (normalizeForAlias(def.canonical) === normalized) return def.canonical;
  }

  // Alias match
  for (const def of CANONICAL_FIELDS) {
    for (const alias of def.aliases) {
      if (alias === normalized) return def.canonical;
    }
  }

  return null;
}
