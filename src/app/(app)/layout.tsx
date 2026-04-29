import { TabBar } from '@/components/TabBar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main style={{
        maxWidth: 480,
        margin: '0 auto',
        minHeight: '100svh',
        paddingBottom: 'calc(max(env(safe-area-inset-bottom), 20px) + 120px)',
      }}>
        {children}
      </main>
      <TabBar />
    </>
  );
}
