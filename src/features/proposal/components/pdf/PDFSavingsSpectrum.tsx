import { View, Text, StyleSheet } from '@react-pdf/renderer';
import type { SavingsRange } from '../../types/proposal.types';

const TEAL = '#005F78';
const TEAL_SOFT = '#E8F1F4';
const ORANGE = '#C95A38';
const INK = '#1A3A42';
const MUTED = '#5A6E73';
const BORDER = '#D9CFC0';

const s = StyleSheet.create({
  container: { marginVertical: 12 },
  title: { fontSize: 14, fontWeight: 500, color: TEAL, marginBottom: 8 },
  bar: { flexDirection: 'row', height: 20, borderRadius: 4, overflow: 'hidden' },
  left: { backgroundColor: TEAL_SOFT },
  center: { backgroundColor: TEAL },
  right: { backgroundColor: BORDER },
  valuesRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  valueBox: { alignItems: 'center', flex: 1 },
  valueText: { fontSize: 14, fontWeight: 500, color: TEAL },
  valueTextProjected: { fontSize: 16, fontWeight: 600, color: TEAL },
  projectedUnderline: {
    width: 40,
    height: 2,
    backgroundColor: ORANGE,
    marginTop: 3,
  },
  valueLabel: { fontSize: 9, color: MUTED, marginTop: 2 },
  rangeSummary: { fontSize: 8, color: MUTED, marginTop: 6, lineHeight: 1.4 },
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
          <Text style={s.valueTextProjected}>{fmt(range.projected)}</Text>
          <View style={s.projectedUnderline} />
          <Text style={s.valueLabel}>Projected Savings</Text>
        </View>
        <View style={s.valueBox}>
          <Text style={s.valueText}>{fmt(range.optimal)}</Text>
          <Text style={s.valueLabel}>Optimal Savings</Text>
        </View>
      </View>
      <Text style={s.rangeSummary}>
        Savings range reflects variability in participation rates, employee turnover, salary distribution, filing status changes, and benefit elections. Projected Savings represents the most likely outcome.
      </Text>
    </View>
  );
}
