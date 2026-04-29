interface ProgressRingProps {
  size?: number;
  strokeWidth?: number;
  completed: number;
  total: number;
  children?: React.ReactNode;
}

export function ProgressRing({ size = 188, strokeWidth = 14, completed, total, children }: ProgressRingProps) {
  const r = (size - strokeWidth) / 2;
  const c = 2 * Math.PI * r;
  const pct = total > 0 ? (completed + 0.5) / total : 0;
  const dash = Math.max(0, Math.min(c, c * pct));
  const center = size / 2;

  return (
    <div style={{ width: size, height: size, position: 'relative' }}>
      <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id="ringGrad" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#a1f0c2" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
        </defs>
        <circle
          cx={center} cy={center} r={r}
          stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth} fill="none"
        />
        <circle
          cx={center} cy={center} r={r}
          stroke="url(#ringGrad)" strokeWidth={strokeWidth} fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          style={{ transition: 'stroke-dasharray 0.4s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        {children}
      </div>
    </div>
  );
}
