import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { PDFSavingsSpectrum } from './PDFSavingsSpectrum';
import { TAX_RATE_YEAR } from '@/config/tax-rates';
import type { CompanyInfo, ProposalResult } from '../../types/proposal.types';

const s = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 10, color: '#1E293B', backgroundColor: '#FFFFFF' },
  header: { marginBottom: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  brand: { fontSize: 10, color: '#94A3AF', letterSpacing: 1.5, textTransform: 'uppercase' },
  companyName: { fontSize: 22, fontWeight: 700, color: '#1E293B', marginTop: 4 },
  subtitle: { fontSize: 10, color: '#64748B', marginTop: 2 },
  projectedBox: { alignItems: 'flex-end' },
  projectedLabel: { fontSize: 8, color: '#94A3AF', textTransform: 'uppercase', letterSpacing: 0.5 },
  projectedValue: { fontSize: 24, fontWeight: 700, color: '#5ECEB0', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 12 },
  kpiRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  kpiCard: { flex: 1, backgroundColor: '#F8FAFC', borderRadius: 8, padding: 12, border: '1 solid #E2E8F0' },
  kpiLabel: { fontSize: 7, color: '#94A3AF', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5 },
  kpiValue: { fontSize: 18, fontWeight: 700, color: '#1E293B', marginTop: 4 },
  kpiValueAccent: { fontSize: 18, fontWeight: 700, color: '#5ECEB0', marginTop: 4 },
  qualRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  qualCard: { flex: 1, borderRadius: 8, border: '1 solid #E2E8F0', padding: 10 },
  qualValue: { fontSize: 14, fontWeight: 700, color: '#1E293B' },
  qualLabel: { fontSize: 8, color: '#64748B', marginTop: 2 },
  tierHeader: { flexDirection: 'row', backgroundColor: '#F8FAFC', padding: 8, borderRadius: 4 },
  tierHeaderCell: { flex: 1, fontSize: 7, fontWeight: 600, color: '#94A3AF', textTransform: 'uppercase' },
  tierRow: { flexDirection: 'row', padding: 8, borderBottom: '0.5 solid #E2E8F0' },
  tierCell: { flex: 1, fontSize: 9 },
  tierCellAccent: { flex: 1, fontSize: 9, fontWeight: 700, color: '#5ECEB0' },
  preparedBy: { marginTop: 16, paddingTop: 10, borderTop: '0.5 solid #E2E8F0' },
  preparedByLabel: { fontSize: 7, color: '#94A3AF', textTransform: 'uppercase', letterSpacing: 0.5 },
  preparedByName: { fontSize: 11, fontWeight: 600, color: '#1E293B', marginTop: 2 },
  preparedByEmail: { fontSize: 9, color: '#5ECEB0', marginTop: 1 },
  disclaimerSection: { marginTop: 20, paddingTop: 12, borderTop: '0.5 solid #E2E8F0' },
  disclaimerTitle: { fontSize: 9, fontWeight: 700, color: '#1E293B', marginBottom: 6 },
  disclaimerText: { fontSize: 8, color: '#64748B', lineHeight: 1.6, marginBottom: 4 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, fontSize: 7, color: '#94A3AF', textAlign: 'center' },
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
  const qualifiedPct = result.totalEmployees > 0 ? Math.round((result.qualifiedEmployees / result.totalEmployees) * 100) : 0;

  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        <View style={s.header}>
          <View style={s.headerRow}>
            <View>
              <Text style={s.brand}>Section 125 Proposal</Text>
              <Text style={s.companyName}>{company.name || 'Company'}</Text>
              <Text style={s.subtitle}>Section 125 Cafeteria Plan — Tax Savings Proposal</Text>
              <Text style={s.subtitle}>{date} · {company.employeeCount} employees</Text>
            </View>
            <View style={s.projectedBox}>
              {brokerName ? (
                <Text style={{ fontSize: 8, color: '#64748B', marginBottom: 4 }}>Prepared by {brokerName}</Text>
              ) : null}
              <Text style={s.projectedLabel}>Projected Annual Savings</Text>
              <Text style={s.projectedValue}>{fmt(result.savingsRange.projected)}</Text>
            </View>
          </View>
        </View>

        <View style={s.divider} />

        <View style={s.kpiRow}>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>Projected Annual FICA Savings</Text>
            <Text style={s.kpiValueAccent}>{fmt(result.employerAnnualFICASavings)}</Text>
          </View>
          <View style={s.kpiCard}>
            <Text style={s.kpiLabel}>Projected Avg. Employee Savings</Text>
            <Text style={s.kpiValue}>{fmt(result.avgEmployeeAnnualSavings)}</Text>
          </View>
        </View>

        <View style={s.qualRow}>
          <View style={s.qualCard}>
            <Text style={s.qualValue}>{result.qualifiedEmployees} of {result.totalEmployees} ({qualifiedPct}%)</Text>
            <Text style={s.qualLabel}>Qualified Employees — meet the income threshold</Text>
          </View>
          <View style={s.qualCard}>
            <Text style={s.qualValue}>{result.positivelyImpactedCount} ({result.positivelyImpactedPercent}%)</Text>
            <Text style={s.qualLabel}>Estimated Positively Impacted — increased take-home pay</Text>
          </View>
        </View>

        <PDFSavingsSpectrum range={result.savingsRange} proposalType={proposalType} />

        <View style={s.divider} />

        <Text style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>Tier Breakdown</Text>
        <Text style={{ fontSize: 8, fontStyle: 'italic', color: '#94A3AF', marginBottom: 8 }}>Estimates based on provided data</Text>
        <View style={s.tierHeader}>
          <Text style={s.tierHeaderCell}>Tier</Text>
          <Text style={[s.tierHeaderCell, { textAlign: 'right' }]}># Employees (%)</Text>
          <Text style={[s.tierHeaderCell, { textAlign: 'right' }]}>Avg. Salary</Text>
          <Text style={[s.tierHeaderCell, { textAlign: 'right' }]}>FICA Savings/EE</Text>
        </View>
        {result.tierResults.map((tier) => {
          const pct = result.totalEmployees > 0 ? Math.round((tier.employeeCount / result.totalEmployees) * 100) : 0;
          return (
            <View key={tier.tier} style={s.tierRow}>
              <Text style={[s.tierCell, { fontWeight: 600 }]}>{tier.tier}</Text>
              <Text style={[s.tierCell, { textAlign: 'right' }]}>{tier.employeeCount} ({pct}%)</Text>
              <Text style={[s.tierCell, { textAlign: 'right' }]}>{fmt(tier.avgSalary)}</Text>
              <Text style={[s.tierCellAccent, { textAlign: 'right' }]}>{fmt(tier.ficaSavingsPerEmployee)}</Text>
            </View>
          );
        })}

        {/* Prepared By */}
        {brokerName && (
          <View style={s.preparedBy}>
            <Text style={s.preparedByLabel}>Prepared By</Text>
            <Text style={s.preparedByName}>{brokerName}</Text>
            {brokerEmail && <Text style={s.preparedByEmail}>{brokerEmail}</Text>}
          </View>
        )}

        {/* Disclosures */}
        <View style={s.disclaimerSection}>
          <Text style={s.disclaimerTitle}>Important Disclosures</Text>
          <Text style={s.disclaimerText}>
            This proposal provides estimated projections based on the data provided and current federal and state tax rates as of {TAX_RATE_YEAR}. Actual results will depend on employee participation rates, workforce changes, benefit elections, and tax law modifications.
          </Text>
          <Text style={s.disclaimerText}>
            Savings estimates assume all eligible employees are W-2 employees of the employer group. Independent contractors and 1099 workers are not eligible for Section 125 plans.
          </Text>
          <Text style={s.disclaimerText}>
            This document is for informational purposes only and does not constitute tax, legal, or financial advice. Consult with a qualified tax professional before implementing a Section 125 Cafeteria Plan.
          </Text>
          <Text style={s.disclaimerText}>
            Projected Savings represents the most likely outcome based on provided data. Actual savings may fall within the Conservative Estimate to Optimal Savings range shown above.
          </Text>
        </View>

        <Text style={s.footer}>
          Section 125 Cafeteria Plan Tax Savings Proposal · Generated {date}
        </Text>
      </Page>
    </Document>
  );
}
