import { DISCLAIMER_TEXT } from '@/constants/proposalCopy';

export function DisclaimerCard() {
  return (
    <div
      className="glass-secondary"
      style={{ borderColor: '#D9CFC0' }}
    >
      <h4 className="text-[14px] font-semibold text-text-primary" style={{ marginBottom: 12 }}>
        Disclaimer
      </h4>
      <p className="text-[12px] leading-[1.6] text-text-secondary">
        {DISCLAIMER_TEXT}
      </p>
    </div>
  );
}
