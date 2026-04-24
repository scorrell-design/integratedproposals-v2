import { CANONICAL_FIELDS, matchCanonical, normalizeForAlias, type CanonicalFieldDef } from '@/config/field-aliases';

/**
 * Maps canonical field names to the actual column header found in the uploaded file.
 * null = not detected.
 */
export type ColumnMapping = Record<string, string | null>;

export type FieldStatus = 'detected' | 'not_detected' | 'auto_filled' | 'required_missing';

export interface RecognizedField {
  key: string;
  label: string;
  status: FieldStatus;
  classification: 'required' | 'optional' | 'conditional';
  group: 'employeePay' | 'taxFiling' | 'benefitsDeductions' | 'stateSpecific';
  matchedColumn?: string;
  conditionalNote?: string;
  autoFilledFrom?: string;
  validRowCount?: number;
  totalRowCount?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  rowCount: number;
  columns: string[];
  suggestedMapping: ColumnMapping;
  recognizedFields: RecognizedField[];
}

const VALID_PAY_SCHEDULES = new Set(['BW', 'W', 'SM', 'M']);
const VALID_STATE_CODES = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC',
]);

/**
 * Auto-detect column mapping using the canonical alias table.
 */
export function detectColumnMapping(columns: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  for (const def of CANONICAL_FIELDS) {
    mapping[def.canonical] = null;
  }

  const used = new Set<number>();

  for (const def of CANONICAL_FIELDS) {
    for (let i = 0; i < columns.length; i++) {
      if (used.has(i)) continue;
      const matched = matchCanonical(columns[i]);
      if (matched === def.canonical) {
        mapping[def.canonical] = columns[i];
        used.add(i);
        break;
      }
    }
  }

  // Second pass: fuzzy containment for fields still unmatched
  for (const def of CANONICAL_FIELDS) {
    if (mapping[def.canonical]) continue;
    const normAliases = def.aliases.map((a) => a.toLowerCase());
    for (let i = 0; i < columns.length; i++) {
      if (used.has(i)) continue;
      const normCol = normalizeForAlias(columns[i]);
      for (const alias of normAliases) {
        if (normCol.includes(alias) || alias.includes(normCol)) {
          mapping[def.canonical] = columns[i];
          used.add(i);
          break;
        }
      }
      if (mapping[def.canonical]) break;
    }
  }

  return mapping;
}

/**
 * Build recognized fields list with status, grouped by canonical schema.
 */
export function detectRecognizedFields(
  columns: string[],
  data: Record<string, string>[],
  mapping: ColumnMapping,
): RecognizedField[] {
  const totalRows = data.length;
  const statesInData = collectStatesFromData(data, mapping);

  return CANONICAL_FIELDS.map((def) => {
    const col = mapping[def.canonical];
    const isDetected = col != null;

    // State-specific: only relevant if the state is present
    if (def.group === 'stateSpecific') {
      const relevant = isStateFieldRelevant(def.canonical, statesInData);
      if (!relevant) {
        return {
          key: def.canonical,
          label: def.label,
          status: 'not_detected' as FieldStatus,
          classification: def.classification,
          group: def.group,
          conditionalNote: def.conditionalNote,
          totalRowCount: totalRows,
        };
      }
    }

    // Auto-fill WorkedInState from State
    if (def.canonical === 'WorkedInState' && !isDetected && mapping['State']) {
      return {
        key: def.canonical,
        label: def.label,
        status: 'auto_filled' as FieldStatus,
        classification: def.classification,
        group: def.group,
        autoFilledFrom: 'State',
        totalRowCount: totalRows,
      };
    }

    if (isDetected) {
      const validCount = countValidRows(data, col!, def);
      return {
        key: def.canonical,
        label: def.label,
        status: 'detected' as FieldStatus,
        classification: def.classification,
        group: def.group,
        matchedColumn: col!,
        validRowCount: validCount,
        totalRowCount: totalRows,
        conditionalNote: def.conditionalNote,
      };
    }

    return {
      key: def.canonical,
      label: def.label,
      status: def.classification === 'required' ? 'required_missing' as FieldStatus : 'not_detected' as FieldStatus,
      classification: def.classification,
      group: def.group,
      conditionalNote: def.conditionalNote,
      totalRowCount: totalRows,
    };
  });
}

function countValidRows(data: Record<string, string>[], col: string, def: CanonicalFieldDef): number {
  let valid = 0;
  for (const row of data) {
    const val = (row[col] ?? '').trim();
    if (val !== '') valid++;
  }
  return valid;
}

function collectStatesFromData(data: Record<string, string>[], mapping: ColumnMapping): Set<string> {
  const states = new Set<string>();
  const stateCol = mapping['State'];
  const workCol = mapping['WorkedInState'];
  for (const row of data) {
    if (stateCol) {
      const s = (row[stateCol] ?? '').toUpperCase().trim();
      if (VALID_STATE_CODES.has(s)) states.add(s);
    }
    if (workCol) {
      const s = (row[workCol] ?? '').toUpperCase().trim();
      if (VALID_STATE_CODES.has(s)) states.add(s);
    }
  }
  return states;
}

function isStateFieldRelevant(canonical: string, statesInData: Set<string>): boolean {
  if (canonical === 'WithholdingRate_AZ') return statesInData.has('AZ');
  if (canonical === 'ExemptionAmt_MS') return statesInData.has('MS');
  if (canonical === 'SpouseWorks_MO') return statesInData.has('MO');
  if (canonical === 'StateDepExemptions_ALGALA') {
    return statesInData.has('AL') || statesInData.has('GA') || statesInData.has('LA');
  }
  return false;
}

/**
 * Validate the file with hard-block + warning conditions per spec.
 */
export function validateFile(
  columns: string[],
  data: Record<string, string>[],
  mapping: ColumnMapping,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (data.length === 0) {
    errors.push('File contains no data rows.');
    return { isValid: false, errors, warnings, rowCount: 0, columns, suggestedMapping: mapping, recognizedFields: [] };
  }

  // Required field checks
  const requiredFields = CANONICAL_FIELDS.filter((f) => f.classification === 'required');
  for (const f of requiredFields) {
    if (!mapping[f.canonical]) {
      if (f.canonical === 'WorkedInState' && mapping['State']) {
        warnings.push('Worked in State column not found. Assuming all employees work in their state of residence.');
      } else {
        errors.push(`Required column "${f.label}" not detected. Please map or add this column.`);
      }
    }
  }

  // GrossWagesPPP data quality
  const grossCol = mapping['GrossWagesPPP'];
  if (grossCol) {
    let invalid = 0;
    for (const row of data) {
      const cleaned = String(row[grossCol] ?? '').replace(/[,$\s]/g, '').replace(/^\((.+)\)$/, '-$1');
      const val = parseFloat(cleaned);
      if (isNaN(val) || val <= 0) invalid++;
    }
    const pct = invalid / data.length;
    if (pct > 0.10) {
      errors.push(`Over ${Math.round(pct * 100)}% of rows have invalid Gross Wages values. Please verify the column.`);
    } else if (invalid > 0) {
      warnings.push(`${invalid} row(s) have invalid or missing Gross Wages and will be excluded.`);
    }
  }

  // State column data quality
  const stateCol = mapping['State'];
  if (stateCol) {
    let invalid = 0;
    for (const row of data) {
      const code = (row[stateCol] ?? '').toUpperCase().trim();
      if (code && !VALID_STATE_CODES.has(code)) invalid++;
    }
    const pct = invalid / data.length;
    if (pct > 0.05) {
      errors.push(`Over ${Math.round(pct * 100)}% of rows have invalid state codes. Valid codes are 2-letter US state abbreviations.`);
    } else if (invalid > 0) {
      warnings.push(`${invalid} row(s) have invalid state codes and will use default state.`);
    }
  }

  // PaySchedule data quality
  const payCol = mapping['PaySchedule'];
  if (payCol) {
    let invalid = 0;
    for (const row of data) {
      const val = (row[payCol] ?? '').toUpperCase().trim();
      if (val && !VALID_PAY_SCHEDULES.has(val)) invalid++;
    }
    const pct = invalid / data.length;
    if (pct > 0.05) {
      errors.push(`Over ${Math.round(pct * 100)}% of rows have invalid Pay Schedule values. Expected: BW, W, SM, or M.`);
    } else if (invalid > 0) {
      warnings.push(`${invalid} row(s) have non-standard Pay Schedule values. Defaulting to Bi-Weekly.`);
    }
  }

  // Fed2020W4 warnings
  if (!mapping['Fed2020W4']) {
    warnings.push('W-4 format column not found. Assuming 2020+ W-4 format for all employees.');
  }

  // State-specific field warnings
  const statesInData = collectStatesFromData(data, mapping);
  const stateConditionalFields: { canonical: string; states: string[] }[] = [
    { canonical: 'StateDepExemptions_ALGALA', states: ['AL', 'GA', 'LA'] },
    { canonical: 'WithholdingRate_AZ', states: ['AZ'] },
    { canonical: 'ExemptionAmt_MS', states: ['MS'] },
    { canonical: 'SpouseWorks_MO', states: ['MO'] },
  ];
  for (const scf of stateConditionalFields) {
    const relevant = scf.states.some((s) => statesInData.has(s));
    if (relevant && !mapping[scf.canonical]) {
      const def = CANONICAL_FIELDS.find((f) => f.canonical === scf.canonical);
      if (def) {
        warnings.push(`State-specific column "${def.label}" not found for ${scf.states.join('/')} employees. Using default rates.`);
      }
    }
  }

  // W-4 consistency checks
  const w4Col = mapping['Fed2020W4'];
  const allowCol = mapping['FedAllowances_2019W4'];
  const depAmtCol = mapping['2020W4FedDepAmt'];
  const box2cCol = mapping['2020W4Box2c'];
  if (w4Col) {
    let conflictCount = 0;
    for (const row of data) {
      const w4val = (row[w4Col] ?? '').toUpperCase().trim();
      if (w4val === 'Y') {
        if (allowCol && (row[allowCol] ?? '').trim() !== '') conflictCount++;
      } else if (w4val === 'N') {
        if (depAmtCol && (row[depAmtCol] ?? '').trim() !== '') conflictCount++;
        if (box2cCol && (row[box2cCol] ?? '').trim() !== '') conflictCount++;
      }
    }
    if (conflictCount > 0) {
      warnings.push(`${conflictCount} row(s) have conflicting W-4 format data. Fields inconsistent with the W-4 version will be ignored.`);
    }
  }

  // State-specific field on wrong state warnings
  for (const scf of stateConditionalFields) {
    const col = mapping[scf.canonical];
    if (!col) continue;
    let wrongState = 0;
    for (const row of data) {
      const val = (row[col] ?? '').trim();
      if (!val) continue;
      const empState = stateCol ? (row[stateCol] ?? '').toUpperCase().trim() : '';
      const empWorkState = mapping['WorkedInState'] ? (row[mapping['WorkedInState']!] ?? '').toUpperCase().trim() : empState;
      const isRelevant = scf.states.includes(empState) || scf.states.includes(empWorkState);
      if (!isRelevant) wrongState++;
    }
    if (wrongState > 0) {
      const def = CANONICAL_FIELDS.find((f) => f.canonical === scf.canonical);
      warnings.push(`${wrongState} row(s) have "${def?.label}" data for employees outside ${scf.states.join('/')}. This data will be ignored.`);
    }
  }

  if (data.length > 10000) warnings.push('Large file detected. Processing may take a moment.');

  const recognizedFields = detectRecognizedFields(columns, data, mapping);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    rowCount: data.length,
    columns,
    suggestedMapping: mapping,
    recognizedFields,
  };
}
