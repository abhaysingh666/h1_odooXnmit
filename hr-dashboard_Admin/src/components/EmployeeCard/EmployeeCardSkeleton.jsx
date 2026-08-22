export default function EmployeeCardSkeleton() {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-4">
      <div className="flex items-start justify-between">
        <div className="skeleton h-14 w-14 rounded-full" />
        <div className="skeleton h-3 w-3 rounded-full" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="skeleton h-4 w-3/5 rounded" />
        <div className="skeleton h-3 w-2/5 rounded" />
        <div className="skeleton h-3 w-4/5 rounded" />
        <div className="skeleton h-3 w-3/5 rounded" />
      </div>
    </div>
  );
}
