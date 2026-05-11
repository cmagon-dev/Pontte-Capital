import Sidebar from '@/app/components/Sidebar';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-slate-950 min-w-0 ml-64">
        {children}
      </main>
    </div>
  );
}
