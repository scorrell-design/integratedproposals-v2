import { Document, Page, View, Text, StyleSheet, Font } from '@react-pdf/renderer';
import { PDFSavingsSpectrum } from './PDFSavingsSpectrum';
import type { CompanyInfo, ProposalResult } from '../../types/proposal.types';

Font.register({
  family: 'Geist',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/geist-sans@latest/latin-400-normal.ttf', fontWeight: 400 },
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/geist-sans@latest/latin-500-normal.ttf', fontWeight: 500 },
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/geist-sans@latest/latin-600-normal.ttf', fontWeight: 600 },
    { src: 'https://cdn.jsdelivr.net/fontsource/fonts/geist-sans@latest/latin-700-normal.ttf', fontWeight: 700 },
  ],
});

const TEAL = '#005F78';
const TEAL_SOFT = '#E8F1F4';
const ORANGE = '#C95A38';
const CREAM = '#F5EDE1';
const CREAM_SOFT = '#FAF5EC';
const INK = '#1A3A42';
const MUTED = '#5A6E73';
const BORDER = '#D9CFC0';

const s = StyleSheet.create({
  page: {
    paddingTop: 0,
    paddingBottom: 60,
    paddingHorizontal: 48,
    fontFamily: 'Geist',
    fontSize: 10,
    color: INK,
    backgroundColor: CREAM,
  },
  headerBand: {
    marginHorizontal: -48,
    marginTop: 0,
    paddingHorizontal: 48,
    paddingVertical: 20,
    backgroundColor: TEAL,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 72,
  },
  headerBrandText: {
    fontSize: 14,
    fontWeight: 500,
    color: '#FFFFFF',
    letterSpacing: 2.1,
  },
  headerEyebrow: {
    fontSize: 10,
    fontWeight: 500,
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  companyName: {
    fontSize: 28,
    fontWeight: 500,
    color: TEAL,
    marginTop: 24,
  },
  orangeBar: {
    width: 60,
    height: 3,
    backgroundColor: ORANGE,
    marginTop: 8,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 11,
    color: MUTED,
  },
  dateLine: {
    fontSize: 10,
    color: MUTED,
    marginTop: 2,
  },
  divider: {
    height: 0.5,
    backgroundColor: BORDER,
    marginVertical: 14,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
    marginBottom: 14,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: TEAL_SOFT,
    borderRadius: 6,
    padding: 12,
    borderLeft: `3 solid ${TEAL}`,
  },
  kpiLabel: {
    fontSize: 9,
    color: TEAL,
    textTransform: 'uppercase',
    fontWeight: 500,
    letterSpacing: 0.7,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: 600,
    color: INK,
    marginTop: 4,
  },
  kpiSublabel: {
    fontSize: 9,
    color: MUTED,
    marginTop: 2,
  },
  qualRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  qualCard: {
    flex: 1,
    borderRadius: 6,
    border: `1 solid ${BORDER}`,
    padding: 10,
    backgroundColor: '#FFFFFF',
  },
  qualValue: {
    fontSize: 14,
    fontWeight: 600,
    color: INK,
  },
  qualLabel: {
    fontSize: 9,
    color: MUTED,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 500,
    color: TEAL,
    marginBottom: 4,
  },
  tierHeader: {
    flexDirection: 'row',
    backgroundColor: TEAL_SOFT,
    padding: 8,
    borderRadius: 4,
  },
  tierHeaderCell: {
    flex: 1,
    fontSize: 8,
    fontWeight: 500,
    color: TEAL,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tierRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: `0.5 solid ${BORDER}`,
  },
  tierRowAlt: {
    flexDirection: 'row',
    padding: 8,
    borderBottom: `0.5 solid ${BORDER}`,
    backgroundColor: CREAM_SOFT,
  },
  tierCell: {
    flex: 1,
    fontSize: 10,
    color: INK,
  },
  tierCellAccent: {
    flex: 1,
    fontSize: 10,
    fontWeight: 600,
    color: TEAL,
  },
  tierMethodology: {
    fontSize: 8,
    color: MUTED,
    marginTop: 6,
  },
  preparedBy: {
    marginTop: 16,
    paddingTop: 10,
    borderTop: `0.5 solid ${BORDER}`,
  },
  preparedByLabel: {
    fontSize: 8,
    color: MUTED,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  preparedByName: {
    fontSize: 11,
    fontWeight: 600,
    color: INK,
    marginTop: 2,
  },
  preparedByEmail: {
    fontSize: 9,
    color: TEAL,
    marginTop: 1,
  },
  disclaimerSection: {
    marginTop: 20,
    paddingTop: 12,
    borderTop: `0.5 solid ${BORDER}`,
  },
  disclaimerTitle: {
    fontSize: 13,
    fontWeight: 500,
    color: TEAL,
    marginBottom: 6,
  },
  disclaimerText: {
    fontSize: 9,
    color: MUTED,
    lineHeight: 1.5,
    marginBottom: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 48,
    right: 48,
    borderTop: `0.5 solid ${BORDER}`,
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 8,
    color: MUTED,
  },
  footerBrand: {
    fontSize: 8,
    color: TEAL,
    fontWeight: 500,
    letterSpacing: 1,
  },
});

const fmt = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;

interface ProposalPDFProps {
  company: CompanyInfo;
  result: ProposalResult;
  proposalType: 'quick_proposal' | 'informed_analysis';
  brokerName?: string;
  brokerEmail?: string;
}

export function ProposalPDF({ company, result, proposalType, brokerName, brokerEmail }: ProposalPDFProps) {
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const currentTaxYear = new Date().getFullYear();
  const qualifiedPct = result.totalEmployees > 0 ? Math.round((result.qualifiedEmployees / result.totalEmployees) * 100) : 0;
  const bd = result.combinedSavingsBreakdown;

  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        {/* Header Band */}
        <View style={s.headerBand}>
          <Text style={s.headerBrandText}>SYNRGY</Text>
          <Text style={s.headerEyebrow}>Hospital Indemnity Plan Proposal</Text>
        </View>

        {/* Company Info */}
        <Text style={s.companyName}>{company.name || 'Company'}</Text>
        <View style={s.orangeBar} />
        <Text style={s.subtitle}>Hospital Indemnity Plan — Tax Savings Proposal</Text>
        <Text style={s.dateLine}>{date} · {company.employeeCount} employees</Text>
        {brokerName ? (
          <Text style={[s.dateLine, { marginTop: 2 }]}>Prepared by {brokerName}</Text>
        ) : null}

        <View style={s.divider} />

        {/* KPI Cards — hero Combined first */}
        <View style={s.kpiRow}>
          <View style={[s.kpiCard, { flex: 1.4, backgroundColor: 'rgba(0, 95, 120, 0.06)' }]}>
            <Text style={s.kpiLabel}>Combined Annual Tax Savings</Text>
            <Text style={[s.kpiValue, { fontSize: 28 }]}>{fmt(result.combinedAnnualTaxSavings)}</Text>
            <Text style={s.kpiSublabel}>~{fmt(result.combinedPerEmployeeSavings)} per employee/year</Text>
          </View>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>Annual Employer Savings</Text>
            <Text style={s.kpiValue}>{fmt(result.employerAnnualFICASavings)}</Text>
            <Text style={s.kpiSublabel}>Employer FICA only (7.65%)</Text>
          </View>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>Avg. Employee Take-Home Increase</Text>
            <Text style={s.kpiValue}>{fmt(result.avgEmployeeAnnualSavings)}/yr</Text>
            <Text style={s.kpiSublabel}>Per qualified employee</Text>
          </View>
        </View>

        {/* Combined Savings Breakdown */}
        <View style={{ borderRadius: 6, border: `0.5 solid ${BORDER}`, padding: 12, marginBottom: 14 }}>
          <Text style={{ fontSize: 11, fontWeight: 600, color: INK, marginBottom: 8 }}>Combined Tax Savings — Composition</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottom: `0.5 solid ${BORDER}` }}>
            <Text style={{ fontSize: 9, color: MUTED }}>Employer FICA savings (7.65%)</Text>
            <Text style={{ fontSize: 9, fontWeight: 600, color: INK }}>{fmt(bd.employerFICA)}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottom: `0.5 solid ${BORDER}` }}>
            <Text style={{ fontSize: 9, color: MUTED }}>Employee FICA savings (7.65%)</Text>
            <Text style={{ fontSize: 9, fontWeight: 600, color: INK }}>{fmt(bd.employeeFICA)}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottom: `0.5 solid ${BORDER}` }}>
            <Text style={{ fontSize: 9, color: MUTED }}>Employee federal tax avoidance (~22%)</Text>
            <Text style={{ fontSize: 9, fontWeight: 600, color: INK }}>{fmt(bd.employeeFederalTax)}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, marginTop: 2 }}>
            <Text style={{ fontSize: 10, fontWeight: 600, color: INK }}>Total combined annual savings</Text>
            <Text style={{ fontSize: 12, fontWeight: 700, color: TEAL }}>{fmt(result.combinedAnnualTaxSavings)}</Text>
          </View>
          <Text style={{ fontSize: 8, color: MUTED, marginTop: 6, lineHeight: 1.4 }}>
            Combined savings reflects total tax avoidance across employer payroll taxes and employee paycheck taxes when benefits are pre-taxed under Section 125. Employee federal tax estimate uses a 22% blended bracket; actual savings vary by individual filing status.
          </Text>
        </View>

        {/* Qualified / Positively Impacted */}
        <View style={s.qualRow}>
          <View style={s.qualCard}>
            <Text style={s.qualValue}>{result.qualifiedEmployees} of {result.totalEmployees} ({qualifiedPct}%)</Text>
            <Text style={s.qualLabel}>Eligible Employees — meet income threshold</Text>
          </View>
          <View style={s.qualCard}>
            <Text style={s.qualValue}>{result.positivelyImpactedCount} ({result.positivelyImpactedPercent}%)</Text>
            <Text style={s.qualLabel}>Estimated Positively Impacted — increased take-home pay</Text>
          </View>
        </View>

        {/* Savings Outlook */}
        <PDFSavingsSpectrum range={result.savingsRange} proposalType={proposalType} />

        <View style={s.divider} />

        {/* Tier Breakdown */}
        <Text style={s.sectionTitle}>Tier Breakdown</Text>
        <Text style={{ fontSize: 9, color: MUTED, marginBottom: 8 }}>Estimates based on provided data</Text>
        <View style={s.tierHeader}>
          <Text style={s.tierHeaderCell}>Tier</Text>
          <Text style={[s.tierHeaderCell, { textAlign: 'right' }]}># Employees (%)</Text>
          <Text style={[s.tierHeaderCell, { textAlign: 'right' }]}>Avg. Salary</Text>
          <Text style={[s.tierHeaderCell, { textAlign: 'right' }]}>FICA Savings/EE</Text>
        </View>
        {result.tierResults.map((tier, i) => {
          const pct = result.totalEmployees > 0 ? Math.round((tier.employeeCount / result.totalEmployees) * 100) : 0;
          return (
            <View key={tier.tier} style={i % 2 === 1 ? s.tierRowAlt : s.tierRow}>
              <Text style={[s.tierCell, { fontWeight: 600 }]}>{tier.tier}</Text>
              <Text style={[s.tierCell, { textAlign: 'right' }]}>{tier.employeeCount} ({pct}%)</Text>
              <Text style={[s.tierCell, { textAlign: 'right' }]}>{fmt(tier.avgSalary)}</Text>
              <Text style={[s.tierCellAccent, { textAlign: 'right' }]}>{fmt(tier.ficaSavingsPerEmployee)}</Text>
            </View>
          );
        })}
        {/* Fix #4: methodology note */}
        <Text style={s.tierMethodology}>
          Tier FICA savings assume average pre-tax contributions consistent with typical plan participation.
        </Text>

        {/* Prepared By */}
        {brokerName && (
          <View style={s.preparedBy}>
            <Text style={s.preparedByLabel}>Prepared By</Text>
            <Text style={s.preparedByName}>{brokerName}</Text>
            {brokerEmail && <Text style={s.preparedByEmail}>{brokerEmail}</Text>}
          </View>
        )}

        {/* Disclosures — Fixes #2, #5 */}
        <View style={s.disclaimerSection}>
          <Text style={s.disclaimerTitle}>Important Disclosures</Text>
          <Text style={s.disclaimerText}>
            This proposal provides estimated projections based on the data provided and current federal and state tax rates as of {currentTaxYear}. Actual results will depend on employee participation rates, workforce changes, benefit elections, and tax law modifications.
          </Text>
          <Text style={s.disclaimerText}>
            Savings estimates assume all eligible employees are W-2 employees of the employer group. Independent contractors and 1099 workers are not eligible for plans offered under Section 125 of the Internal Revenue Code.
          </Text>
          <Text style={s.disclaimerText}>
            Plan availability, design requirements, and tax treatment under Section 125 of the Internal Revenue Code may vary by state. Consult state-specific regulations before implementation.
          </Text>
          <Text style={s.disclaimerText}>
            This document is for informational purposes only and does not constitute tax, legal, or financial advice. Consult with a qualified tax professional before implementing a hospital indemnity plan under Section 125 of the Internal Revenue Code.
          </Text>
          <Text style={s.disclaimerText}>
            Projected Savings represents the most likely outcome based on provided data. Actual savings may fall within the Conservative Estimate to Optimal Savings range shown above.
          </Text>
          <Text style={s.disclaimerText}>
            Example values shown use a standard $1,200/month medical premium — the most commonly selected plan tier. Your actual results will reflect the premiums entered.
          </Text>
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            Hospital Indemnity Plan Tax Savings Proposal · Generated {date}
          </Text>
          <Text style={s.footerBrand}>SYNRGY</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
