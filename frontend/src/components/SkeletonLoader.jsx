export function ProductSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 animate-pulse">
      <div className="w-full aspect-square bg-slate-200 rounded-xl" />
      <div className="h-4 bg-slate-200 rounded w-1/3" />
      <div className="h-4 bg-slate-200 rounded w-4/5" />
      <div className="flex justify-between items-center pt-2">
        <div className="h-6 bg-slate-200 rounded w-1/4" />
        <div className="h-4 bg-slate-200 rounded w-1/4" />
      </div>
      <div className="h-9 bg-slate-200 rounded-xl w-full" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-3 animate-pulse p-4 bg-white rounded-2xl border border-slate-200">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 bg-slate-100 rounded-xl w-full" />
      ))}
    </div>
  );
}

export function DashboardCardSkeleton() {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse space-y-3">
      <div className="h-4 bg-slate-200 rounded w-1/3" />
      <div className="h-8 bg-slate-300 rounded w-1/2" />
      <div className="h-3 bg-slate-100 rounded w-2/3" />
    </div>
  );
}
