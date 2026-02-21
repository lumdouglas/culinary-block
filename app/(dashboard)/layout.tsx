export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50 border-t border-slate-200">
      <main className="flex-1 w-full mx-auto p-4 sm:p-8">
        {children}
      </main>
    </div>
  );
}