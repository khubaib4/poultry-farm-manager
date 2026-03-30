import React from "react";

function Base({ className = "" }: { className?: string }): React.ReactElement {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

export function SkeletonText({ width = "w-full", className = "" }: { width?: string; className?: string }): React.ReactElement {
  return <Base className={`h-4 ${width} ${className}`} />;
}

export function SkeletonCard({ className = "" }: { className?: string }): React.ReactElement {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-5 space-y-3 ${className}`}>
      <Base className="h-4 w-1/3" />
      <Base className="h-8 w-1/2" />
      <Base className="h-3 w-2/3" />
    </div>
  );
}

export function SkeletonStatCard(): React.ReactElement {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <Base className="h-4 w-24" />
        <Base className="h-8 w-8 rounded-lg" />
      </div>
      <Base className="h-8 w-20 mb-2" />
      <Base className="h-3 w-16" />
    </div>
  );
}

export function SkeletonTableRow({ cols = 5 }: { cols?: number }): React.ReactElement {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Base className={`h-4 ${i === 0 ? "w-32" : "w-20"}`} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }): React.ReactElement {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="px-4 py-3 text-left">
                <Base className="h-3 w-16" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} cols={cols} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SkeletonDashboard(): React.ReactElement {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Base className="h-7 w-48" />
          <Base className="h-4 w-32" />
        </div>
        <Base className="h-10 w-28 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SkeletonCard className="h-64" />
        <SkeletonCard className="h-64" />
      </div>
    </div>
  );
}

export function SkeletonForm(): React.ReactElement {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5 max-w-2xl">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Base className="h-4 w-24" />
          <Base className="h-10 w-full rounded-lg" />
        </div>
      ))}
      <div className="flex gap-3 pt-2">
        <Base className="h-10 w-24 rounded-lg" />
        <Base className="h-10 w-20 rounded-lg" />
      </div>
    </div>
  );
}
