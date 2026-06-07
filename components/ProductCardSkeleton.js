export default function ProductCardSkeleton() {
  return (
    <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
      {/* Image */}
      <div className="skeleton h-56 w-full" />
      {/* Body */}
      <div className="p-5 space-y-3">
        <div className="skeleton h-3 w-20 rounded-full" />
        <div className="skeleton h-4 w-full rounded-lg" />
        <div className="skeleton h-3 w-3/4 rounded-lg" />
        <div className="skeleton h-3 w-2/3 rounded-lg" />
        <div className="flex items-center gap-2 pt-1">
          {[1,2,3].map(i => (
            <div key={i} className="skeleton h-3.5 w-3.5 rounded-full" />
          ))}
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className="skeleton h-6 w-20 rounded-lg" />
          <div className="skeleton h-9 w-24 rounded-full" />
        </div>
      </div>
    </div>
  );
}
