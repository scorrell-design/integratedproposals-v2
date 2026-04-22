export function GlassBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-base noise-overlay">
      {/* Layer 2 — Gradient mesh blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        {/* Blob 1: deep navy, top-left */}
        <div
          className="absolute"
          style={{
            top: '-10%',
            left: '-5%',
            width: '60%',
            height: '55%',
            background: 'radial-gradient(ellipse at center, rgba(26, 58, 92, 0.4) 0%, transparent 70%)',
            filter: 'blur(160px)',
          }}
        />
        {/* Blob 2: deep teal, bottom-right */}
        <div
          className="absolute"
          style={{
            bottom: '-15%',
            right: '-10%',
            width: '55%',
            height: '60%',
            background: 'radial-gradient(ellipse at center, rgba(13, 61, 61, 0.3) 0%, transparent 70%)',
            filter: 'blur(180px)',
          }}
        />
        {/* Blob 3: faint purple, center-right */}
        <div
          className="absolute"
          style={{
            top: '30%',
            right: '5%',
            width: '35%',
            height: '40%',
            background: 'radial-gradient(ellipse at center, rgba(42, 31, 61, 0.15) 0%, transparent 70%)',
            filter: 'blur(140px)',
          }}
        />
      </div>

      {/* Layer 4 — Decorative depth elements */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }} aria-hidden="true">
        <div
          className="absolute"
          style={{
            top: '12%',
            left: '3%',
            width: 240,
            height: 64,
            borderRadius: 32,
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.04)',
            transform: 'rotate(-15deg)',
          }}
        />
        <div
          className="absolute"
          style={{
            bottom: '15%',
            right: '3%',
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.015)',
            border: '1px solid rgba(255,255,255,0.03)',
          }}
        />
        <div
          className="absolute"
          style={{
            top: '60%',
            left: '2%',
            width: 120,
            height: 36,
            borderRadius: 18,
            background: 'rgba(255,255,255,0.015)',
            border: '1px solid rgba(255,255,255,0.03)',
            transform: 'rotate(8deg)',
          }}
        />
      </div>

      {/* Content layer */}
      <div className="relative" style={{ zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}
