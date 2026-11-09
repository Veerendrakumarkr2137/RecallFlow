import React from "react";

export function CardSkeleton({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-panel p-5 animate-pulse">
          <div className="h-4 bg-slate-800 rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-slate-800/80 rounded w-2/3 mb-2"></div>
          <div className="h-3 bg-slate-800/50 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="glass-panel p-4 animate-pulse">
      <div className="h-6 bg-slate-800 rounded w-1/4 mb-4"></div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-10 bg-slate-800/60 rounded flex items-center px-4 gap-4">
            <div className="h-4 bg-slate-700/60 rounded w-1/6"></div>
            <div className="h-4 bg-slate-700/60 rounded w-1/3"></div>
            <div className="h-4 bg-slate-700/60 rounded w-1/4"></div>
            <div className="h-4 bg-slate-700/60 rounded w-1/6 ml-auto"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="p-4 space-y-4 animate-pulse">
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-slate-800"></div>
        <div className="space-y-2 max-w-md">
          <div className="h-4 bg-slate-800 rounded w-48"></div>
          <div className="h-12 bg-slate-800/70 rounded w-72"></div>
        </div>
      </div>
      <div className="flex gap-3 justify-end">
        <div className="space-y-2 max-w-md text-right">
          <div className="h-10 bg-blue-900/40 rounded w-64 ml-auto"></div>
        </div>
      </div>
    </div>
  );
}
