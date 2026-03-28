export default function DashboardLoading() {
  return (
    <div className="p-6 space-y-6">
      {/* KPI cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            style={{
              background: "#111114",
              border: "1px solid #27272e",
              borderRadius: "12px",
            }}
            className="p-5 space-y-3"
          >
            <div className="h-3 w-20 rounded bg-zinc-800 animate-pulse" />
            <div className="h-7 w-28 rounded bg-zinc-800 animate-pulse" />
            <div className="h-3 w-16 rounded bg-zinc-800 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Chart skeleton */}
      <div
        style={{
          background: "#111114",
          border: "1px solid #27272e",
          borderRadius: "12px",
        }}
        className="p-5 space-y-4"
      >
        <div className="h-4 w-32 rounded bg-zinc-800 animate-pulse" />
        <div className="h-48 w-full rounded bg-zinc-800/50 animate-pulse" />
      </div>

      {/* Table skeleton */}
      <div
        style={{
          background: "#111114",
          border: "1px solid #27272e",
          borderRadius: "12px",
        }}
        className="p-5 space-y-3"
      >
        <div className="h-4 w-40 rounded bg-zinc-800 animate-pulse mb-4" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="h-4 w-full rounded bg-zinc-800 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
