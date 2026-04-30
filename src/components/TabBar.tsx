'use client';
import { usePathname, useRouter } from 'next/navigation';

const TABS = [
  { href: '/home',    label: 'Home',    icon: '⌂' },
  { href: '/library', label: 'Library', icon: '▤' },
  { href: '/history', label: 'History', icon: '↻' },
  { href: '/me',      label: 'Me',      icon: '◎' },
];

export function TabBar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      padding: '8px 16px',
      paddingBottom: 'calc(max(env(safe-area-inset-bottom), 20px) + 48px)',
      background: 'rgba(8,8,8,0.92)',
      backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(255,255,255,0.08)',
    }}>
      <div style={{ display: 'flex', maxWidth: 480, margin: '0 auto', gap: 4 }}>
        {TABS.map(tab => {
          const active = pathname.startsWith(tab.href);
          return (
            <button
              key={tab.href}
              onClick={() => router.push(tab.href)}
              style={{
                flex: 1,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                padding: '8px 4px',
                background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                color: active ? '#a1f0c2' : 'rgba(255,255,255,0.4)',
                transition: 'color 0.15s',
              }}
            >
              <span style={{ fontSize: 18, lineHeight: 1 }}>{tab.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
