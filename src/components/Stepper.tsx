'use client';

interface StepperProps {
  value: number;
  step: number;
  min?: number;
  onChange: (v: number) => void;
  suffix?: string;
}

export function Stepper({ value, step, min = 0, onChange, suffix }: StepperProps) {
  const btn = {
    width: 36, height: 36, borderRadius: 10,
    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
    color: '#fff', fontSize: 18, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  } as const;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button style={btn} onClick={() => onChange(Math.max(min, value - step))} aria-label="decrease">−</button>
      <span style={{ minWidth: 48, textAlign: 'center', fontSize: 17, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
        {value === 0 && suffix === 'BW' ? 'BW' : `${value}${suffix ? ` ${suffix}` : ''}`}
      </span>
      <button style={btn} onClick={() => onChange(value + step)} aria-label="increase">+</button>
    </div>
  );
}
