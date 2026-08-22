export default function EmployeeDetailsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="skeleton h-8 w-40 rounded" />
      <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-6">
        <div className="flex items-center gap-4">
          <div className="skeleton h-20 w-20 rounded-full" />
          <div className="space-y-2">
            <div className="skeleton h-5 w-40 rounded" />
            <div className="skeleton h-4 w-28 rounded" />
            <div className="skeleton h-3 w-20 rounded" />
          </div>
        </div>
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-5">
          <div className="skeleton h-4 w-32 rounded" />
          <div className="mt-4 grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="space-y-2">
                <div className="skeleton h-3 w-16 rounded" />
                <div className="skeleton h-4 w-28 rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
