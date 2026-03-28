import { FileQuestion } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{ background: "#09090b", minHeight: "100vh" }}
      className="flex items-center justify-center px-4"
    >
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
          <FileQuestion className="h-12 w-12 text-orange-500" />
        </div>

        <h1 className="text-4xl font-bold text-white mb-2">404</h1>
        <h2 className="text-lg font-semibold text-white mb-2">
          Page not found
        </h2>
        <p className="text-sm text-zinc-400 mb-6">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>

        <Link
          href="/dashboard"
          className="inline-block w-full py-2.5 rounded-lg font-medium text-sm text-white"
          style={{ background: "#f97316" }}
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
