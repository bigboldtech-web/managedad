"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div
        style={{
          background: "#111114",
          border: "1px solid #27272e",
          borderRadius: "16px",
          maxWidth: "420px",
          width: "100%",
        }}
        className="p-8 text-center"
      >
        <div className="flex justify-center mb-4">
          <AlertTriangle className="h-12 w-12 text-orange-500" />
        </div>

        <h1 className="text-xl font-semibold text-white mb-2">
          Something went wrong
        </h1>
        <p className="text-sm text-zinc-400 mb-6">
          An unexpected error occurred. Please try again or navigate back to the
          dashboard.
        </p>

        {error.message && (
          <p className="text-xs text-zinc-600 mb-6 font-mono break-all">
            {error.message}
          </p>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="w-full py-2.5 rounded-lg font-medium text-sm text-white"
            style={{ background: "#f97316" }}
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="w-full py-2.5 rounded-lg font-medium text-sm text-zinc-300 block"
            style={{ background: "#1c1c21", border: "1px solid #27272e" }}
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
