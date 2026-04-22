import { View, Text, StyleSheet } from '@react-pdf/renderer';
import type { SavingsRange } from '../../types/proposal.types';

const s = StyleSheet.create({
  container: { marginVertical: 12 },
  title: { fontSize: 14, fontWeight: 700, color: '#1E293B', marginBottom: 8 },
  bar: { flexDirection: 'row', height: 20, borderRadius: 4, overflow: 'hidden' },
  left: { backgroundColor: '#94A3B8' },
  center: { backgroundColor: '#5ECEB0' },
  right: { backgroundColor: '#A78BFA' },
  valuesRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  valueBox: { alignItems: 'center', flex: 1 },
  valueText: { fontSize: 14, fontWeight: 700, color: '#1E293B' },
  valueTextAccent: { fontSize: 16, fontWeight: 700, color: '#5ECEB0' },
  valueLabel: { fontSize: 8, color: '#94A3AF', marginTop: 2 },
});

const fmt = (n: number) => `$${n.toLocaleString('en-US')}`;

interface PDFSavingsSpectrumProps {
  range: SavingsRange;
  proposalType: 'quick_proposal' | 'informed_analysis';
}

export function PDFSavingsSpectrum({ range, proposalType }: PDFSavingsSpectrumProps) {
  const isQP = proposalType === 'quick_proposal';
  const zones = isQP
    ? { left: '25%', center: '50%', right: '25%' }
    : { left: '17.5%', center: '65%', right: '17.5%' };

  return (
    <View style={s.container}>
      <Text style={s.title}>Your Savings Outlook</Text>
      <View style={s.bar}>
        <View style={[s.left, { width: zones.left }]} />
        <View style={[s.center, { width: zones.center }]} />
        <View style={[s.right, { width: zones.right }]} />
      </View>
      <View style={s.valuesRow}>
        <View style={s.valueBox}>
          <Text style={s.valueText}>{fmt(range.conservative)}</Text>
          <Text style={s.valueLabel}>Conservative Estimate</Text>
        </View>
        <View style={s.valueBox}>
          <Text style={s.valueTextAccent}>{fmt(range.projected)}</Text>
          <Text style={s.valueLabel}>Projected Savings</Text>
        </View>
        <View style={s.valueBox}>
          <Text style={s.valueText}>{fmt(range.optimal)}</Text>
          <Text style={s.valueLabel}>Optimal Savings</Text>
        </View>
      </View>
      <Text style={{ fontSize: 7, color: '#94A3AF', marginTop: 6, lineHeight: 1.4 }}>
        Savings range reflects variability in participation rates, employee turnover, salary distribution, filing status changes, and benefit elections. Projected Savings represents the most likely outcome.
      </Text>
    </View>
  );
}
