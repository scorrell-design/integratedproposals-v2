import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { GlassBackground } from '@/features/proposal/components/shared/GlassBackground';
import { GlassCard } from '@/features/proposal/components/shared/GlassCard';
import { DisclaimerModal } from '@/features/proposal/components/shared/DisclaimerModal';
import { FileUploadSection } from './sections/FileUploadSection';
import { ColumnMappingSection } from './sections/ColumnMappingSection';
import { ValidationReviewSection } from './sections/ValidationReviewSection';
import { IAResultsSection } from './sections/ResultsSection';
import { detectColumnMapping, validateFile, type ColumnMapping, type ValidationResult, type RecognizedField } from './engine/mini-file-validator';
import { RecognizedFieldsView } from './components/RecognizedFieldsView';
import { analyzeEmployees, type EmployeeResult } from './engine/mini-analyzer';
import { useInformedPDFGeneration } from '@/features/proposal/hooks/useInformedPDFGeneration';
import { payPeriodsPerYear } from '@/utils/format';
import { STATE_TAX_RATES } from '@/config/tax-rates';
import type { ParsedEmployeeRow, ProposalResult, PaycheckComparison, BenefitsConfig } from '@/features/proposal/types/proposal.types';

type Step = 'upload' | 'mapping' | 'confirm' | 'review' | 'results';

const DEFAULT_BENEFITS: BenefitsConfig = {
  enabled: false,
  healthcare: {
    enabled: true,
    participationRate: 75,
    medical: { premiums: { individual: 600, family: 1800 } },
    dental: { premiums: { individual: 45, family: 85 } },
    vision: { premiums: { individual: 15, family: 40 } },
  },
  retirement: { enabled: false, participationRate: 60, contributionRates: { entry: 4, mid: 6, senior: 8, executive: 10 } },
  hsa: { enabled: false, participationRate: 30, annualContribution: 1500 },
};

const VALID_STATE_CODES = new Set(Object.keys(STATE_TAX_RATES));

const PAY_SCHEDULE_MAP: Record<string, 'weekly' | 'biweekly' | 'semimonthly' | 'monthly'> = {
  W: 'weekly', BW: 'biweekly', SM: 'semimonthly', M: 'monthly',
};

function stripBOM(s: string): string {
  return s.replace(/^\uFEFF/, '');
}

function normalizeColumnNames(cols: string[]): string[] {
  return cols.map((c, i) => {
    const cleaned = stripBOM(c).trim();
    return cleaned || `Column_${i + 1}`;
  });
}

function normalizeDataRow(row: Record<string, string>, originalCols: string[], normalizedCols: string[]): Record<string, string> {
  const normalized: Record<string, string> = {};
  for (let i = 0; i < originalCols.length; i++) {
    const val = row[originalCols[i]];
    normalized[normalizedCols[i]] = typeof val === 'string' ? val.trim() : (val != null ? String(val) : '');
  }
  return normalized;
}

function parseCurrencyValue(raw: string | null | undefined): number {
  if (raw == null) return 0;
  const cleaned = String(raw).replace(/[,$\s]/g, '').replace(/^\((.+)\)$/, '-$1');
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : Math.abs(val);
}

function normalizeFilingStatus(val: string): 'single' | 'married' | 'hoh' {
  const l = (val || '').toLowerCase().trim();
  if (l.includes('married') || l === 'mfj' || l === 'm') return 'married';
  if (l.includes('head') || l === 'hoh' || l === 'h') return 'hoh';
  return 'single';
}

function normalizeStateCode(raw: string): string {
  const code = raw.toUpperCase().trim().substring(0, 2);
  return VALID_STATE_CODES.has(code) ? code : 'TX';
}

function sanitizeFilename(name: string): string {
  return name
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b(sample|demo|v\d+|test)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim() || 'Company';
}

interface InformedAnalysisPageProps {
  groupId?: string;
}

export function InformedAnalysisPage({ groupId: _groupId = 'demo' }: InformedAnalysisPageProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [rawData, setRawData] = useState<Record<string, string>[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [employees, setEmployees] = useState<ParsedEmployeeRow[]>([]);
  const [result, setResult] = useState<ProposalResult | null>(null);
  const [paycheckComparisons, setPaycheckComparisons] = useState<PaycheckComparison[]>([]);
  const [employeeResults, setEmployeeResults] = useState<EmployeeResult[]>([]);
  const [recognizedFields, setRecognizedFields] = useState<RecognizedField[]>([]);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [payrollFreq, setPayrollFreq] = useState<'weekly' | 'biweekly' | 'semimonthly' | 'monthly'>('biweekly');

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [confirmedFreq, setConfirmedFreq] = useState<'weekly' | 'biweekly' | 'semimonthly' | 'monthly'>('biweekly');

  const { downloadPDF: downloadInformedPDF, isGenerating: isGeneratingPDF } = useInformedPDFGeneration();

  const rawDataRef = useRef<Record<string, string>[]>([]);
  const mappingRef = useRef<ColumnMapping>(mapping);

  const parseFile = useCallback(async (f: File) => {
    const ext = f.name.split('.').pop()?.toLowerCase();
    if (ext === 'csv') {
      return new Promise<{ columns: string[]; data: Record<string, string>[] }>((resolve) => {
        Papa.parse(f, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (h: string) => stripBOM(h).trim(),
          complete: (r) => {
            const cols = r.meta.fields ?? [];
            const data = (r.data as Record<string, string>[]).map((row) => {
              const clean: Record<string, string> = {};
              for (const key of cols) {
                clean[key] = typeof row[key] === 'string' ? row[key].trim() : (row[key] != null ? String(row[key]) : '');
              }
              return clean;
            });
            resolve({ columns: cols, data });
          },
        });
      });
    }
    const buffer = await f.arrayBuffer();
    const wb = XLSX.read(buffer);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { raw: false });
    if (json.length === 0) return { columns: [], data: [] };
    const origCols = Object.keys(json[0]);
    const normCols = normalizeColumnNames(origCols);
    const data = json.map((row) => normalizeDataRow(row, origCols, normCols));
    return { columns: normCols, data };
  }, []);

  const detectPayrollFrequency = useCallback((data: Record<string, string>[], m: ColumnMapping): 'weekly' | 'biweekly' | 'semimonthly' | 'monthly' => {
    const payCol = m['PaySchedule'];
    if (payCol) {
      const sample = (data[0]?.[payCol] || '').toUpperCase().trim();
      if (sample in PAY_SCHEDULE_MAP) return PAY_SCHEDULE_MAP[sample];
      const lower = sample.toLowerCase();
      if (lower.includes('week') && !lower.includes('bi')) return 'weekly';
      if (lower.includes('semi')) return 'semimonthly';
      if (lower.includes('month') && !lower.includes('semi')) return 'monthly';
    }
    return 'biweekly';
  }, []);

  const handleFileSelected = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    const { columns: cols, data } = await parseFile(selectedFile);
    setColumns(cols);
    setRawData(data);
    rawDataRef.current = data;
    const suggested = detectColumnMapping(cols);
    setMapping(suggested);
    mappingRef.current = suggested;
    const freq = detectPayrollFrequency(data, suggested);
    setPayrollFreq(freq);
    setConfirmedFreq(freq);
    setGroupName(sanitizeFilename(selectedFile.name));
    const v = validateFile(cols, data, suggested);
    setValidation(v);
    setRecognizedFields(v.recognizedFields);
    setStep('mapping');
  }, [parseFile, detectPayrollFrequency]);

  const handleUpdateMapping = useCallback((field: string, column: string | null) => {
    const m = { ...mapping, [field]: column };
    setMapping(m);
    mappingRef.current = m;
    setValidation(validateFile(columns, rawData, m));
  }, [mapping, columns, rawData]);

  const handleConfirmMapping = useCallback(() => {
    setShowConfirmModal(true);
  }, []);

  const handleConfirmGroupAndProceed = useCallback(() => {
    setShowConfirmModal(false);
    setPayrollFreq(confirmedFreq);
    setShowDisclaimer(true);
  }, [confirmedFreq]);

  const handleDisclaimerAccept = useCallback(() => {
    setShowDisclaimer(false);
    const currentData = rawDataRef.current;
    const m = mappingRef.current;
    const periods = payPeriodsPerYear(confirmedFreq);

    const getVal = (row: Record<string, string>, canonical: string) => {
      const col = m[canonical];
      return col ? (row[col] ?? '') : '';
    };

    const parsed: ParsedEmployeeRow[] = currentData.map((row, i) => {
      let salary = parseCurrencyValue(getVal(row, 'GrossWagesPPP'));
      if (salary > 0 && salary < 25000) {
        salary = salary * periods;
      }

      // Sum all qualified per-period pre-tax deduction columns
      const medPP = parseCurrencyValue(getVal(row, 'EmployeeContMajorMed'));
      const denPP = parseCurrencyValue(getVal(row, 'EmployeeContDen'));
      const visPP = parseCurrencyValue(getVal(row, 'EmployeeContVis'));
      const additionalPP = parseCurrencyValue(getVal(row, 'AdditionalPreTaxDedPP'));
      const k401PP = parseCurrencyValue(getVal(row, '401KCont'));
      const rothPP = parseCurrencyValue(getVal(row, 'RothCont'));
      const retDeferPP = parseCurrencyValue(getVal(row, 'RetirementDeferral'));
      const k401CatchPP = parseCurrencyValue(getVal(row, '401KCatchupCont'));
      const rothCatchPP = parseCurrencyValue(getVal(row, 'RothCatchupCont'));
      const totalPreTaxPP = medPP + denPP + visPP + additionalPP + k401PP + rothPP + retDeferPP + k401CatchPP + rothCatchPP;

      const firstName = getVal(row, 'FirstName').trim();
      const lastName = getVal(row, 'LastName').trim();
      const empName = [firstName, lastName].filter(Boolean).join(' ') || `Employee ${i + 1}`;

      const empId = getVal(row, 'EmployeeID').trim() || String(i + 1);

      const residenceState = normalizeStateCode(getVal(row, 'State') || 'TX');
      const workedInState = getVal(row, 'WorkedInState').trim();
      const stateForCalc = workedInState ? normalizeStateCode(workedInState) : residenceState;

      const fedMarital = getVal(row, 'FedMaritalStatus');
      const filingStatus = normalizeFilingStatus(fedMarital);

      // Plan tier (pass through raw value for plan tier breakdown)
      const planTierRaw = getVal(row, 'planTier') || getVal(row, 'PlanTier');
      const planTier = planTierRaw ? planTierRaw.trim() || undefined : undefined;

      return {
        employeeId: empId,
        name: empName,
        salary,
        filingStatus,
        stateCode: stateForCalc,
        employmentStatus: 'full_time' as const,
        preTaxPerPeriod: totalPreTaxPP > 0 ? totalPreTaxPP : undefined,
        planTier,
      };
    }).filter((emp) => emp.salary > 0);

    setEmployees(parsed);
    const { result: r, paycheckComparisons: c, employeeResults: er } = analyzeEmployees(parsed, { benefits: DEFAULT_BENEFITS, payrollFrequency: confirmedFreq });
    setResult(r);
    setPaycheckComparisons(c);
    setEmployeeResults(er);
    setStep('results');
    requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  }, [confirmedFreq]);

  const handleDisclaimerBack = useCallback(() => {
    setShowDisclaimer(false);
  }, []);

  const handleReset = useCallback(() => {
    setStep('upload'); setFile(null); setRawData([]); setColumns([]); setResult(null); setEmployees([]); setPaycheckComparisons([]); setEmployeeResults([]); setRecognizedFields([]); setShowDisclaimer(false); setShowConfirmModal(false); setGroupName('');
    rawDataRef.current = []; mappingRef.current = mapping;
  }, []);

  return (
    <GlassBackground>
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-[720px]">
          <div className="glass-primary text-center">
            <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-text-tertiary">Section 125 Proposal Tool</p>
            <h1 className="mt-3 text-[44px] font-bold text-text-primary">Informed Analysis</h1>
            <p className="mx-auto mt-4 max-w-[560px] text-[15px] leading-relaxed text-text-secondary">
              Upload your census or payroll file for a high-accuracy, employee-level savings analysis with paycheck comparison views.
            </p>
            <p className="mx-auto mt-3 max-w-[560px] text-[13px] italic text-text-tertiary">
              Analysis results are projections based on uploaded payroll data and current tax rates. Actual savings will vary based on employee participation, turnover, and benefit elections. This is not a guarantee of savings.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <GlassCard variant="secondary" className="inline-flex items-center gap-2 !rounded-full !px-4 !py-2 text-[13px] font-medium text-text-secondary">
                <BarChart3 className="h-3.5 w-3.5 text-accent" />
                Data-driven — Higher accuracy
              </GlassCard>
              <button
                onClick={() => navigate('/quick-proposal')}
                className="inline-flex items-center gap-2 rounded-full border border-border-glass-light px-4 py-2 text-[13px] font-medium text-text-tertiary hover:text-text-secondary hover:bg-surface-glass-light transition-colors"
              >
                <Zap className="h-3.5 w-3.5" />
                No file? Use Quick Proposal
              </button>
            </div>
          </div>
        </motion.div>

        {(step === 'upload' || step === 'mapping') && <FileUploadSection onFileSelected={handleFileSelected} currentFile={file} />}
        {step === 'mapping' && validation && recognizedFields.length > 0 && (
          <RecognizedFieldsView
            recognizedFields={recognizedFields}
            rowCount={validation.rowCount}
            fileName={file?.name ?? 'file'}
          />
        )}
        {step === 'mapping' && validation && <ColumnMappingSection columns={columns} mapping={mapping} validation={validation} onUpdateMapping={handleUpdateMapping} onConfirm={handleConfirmMapping} />}
        {step === 'review' && <ValidationReviewSection employees={employees} />}
        {step === 'results' && result && <IAResultsSection result={result} paycheckComparisons={paycheckComparisons} companyName={groupName || 'Company'} payrollFrequency={confirmedFreq} employees={employees} employeeResults={employeeResults} onDownloadPDF={() => downloadInformedPDF({ groupName: groupName || 'Company', result, employeeResults, payrollFrequency: confirmedFreq })} onSaveDraft={() => {}} onReset={handleReset} isGeneratingPDF={isGeneratingPDF} isSaving={false} />}
      </div>

      {/* Group Name + Pay Frequency Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[80]"
              style={{ background: 'rgba(0, 0, 0, 0.5)' }}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-[90] flex items-center justify-center p-4"
            >
              <div
                className="w-full"
                style={{
                  maxWidth: 480,
                  background: '#FFFFFF',
                  border: '1px solid #D9CFC0',
                  borderRadius: 22,
                  padding: 32,
                  boxShadow: '0 16px 48px rgba(26, 58, 66, 0.15)',
                }}
              >
                <h2 className="text-[20px] font-semibold text-text-primary">
                  Confirm Group Details
                </h2>
                <p className="text-[14px] text-text-secondary" style={{ marginTop: 8 }}>
                  Verify these details before generating the proposal.
                </p>

                <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <label className="text-[12px] font-semibold text-text-secondary uppercase tracking-[0.05em]">
                      Group / Company Name
                    </label>
                    <input
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      className="glass-input mt-2 w-full py-2.5 px-3 text-[14px]"
                      placeholder="Enter company name"
                    />
                  </div>

                  <div>
                    <label className="text-[12px] font-semibold text-text-secondary uppercase tracking-[0.05em]">
                      Confirm Pay Frequency
                    </label>
                    <select
                      value={confirmedFreq}
                      onChange={(e) => setConfirmedFreq(e.target.value as typeof confirmedFreq)}
                      className="glass-input mt-2 w-full py-2.5 px-3 text-[14px] appearance-none"
                      style={{ background: '#FFFFFF' }}
                    >
                      <option value="weekly">Weekly (52 pay periods)</option>
                      <option value="biweekly">Bi-Weekly (26 pay periods)</option>
                      <option value="semimonthly">Semi-Monthly (24 pay periods)</option>
                      <option value="monthly">Monthly (12 pay periods)</option>
                    </select>
                    <p className="text-[11px] text-text-tertiary mt-1.5">
                      Pay frequency drives all annualized calculations. Verify this matches the uploaded payroll data.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-center" style={{ marginTop: 28, gap: 12 }}>
                  <button
                    onClick={handleConfirmGroupAndProceed}
                    disabled={!groupName.trim()}
                    className="w-full transition-all"
                    style={{
                      background: groupName.trim() ? '#C95A38' : 'rgba(201, 90, 56, 0.3)',
                      color: '#FFFFFF',
                      borderRadius: 24,
                      padding: '14px 24px',
                      fontSize: 16,
                      fontWeight: 600,
                      border: 'none',
                      cursor: groupName.trim() ? 'pointer' : 'not-allowed',
                      opacity: groupName.trim() ? 1 : 0.4,
                    }}
                  >
                    Confirm &amp; Continue
                  </button>
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="text-[14px] text-text-tertiary hover:text-text-secondary hover:underline transition-colors"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <DisclaimerModal
        open={showDisclaimer}
        onAccept={handleDisclaimerAccept}
        onGoBack={handleDisclaimerBack}
      />
    </GlassBackground>
  );
}
