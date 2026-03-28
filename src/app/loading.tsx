export default function Loading() {
  return (
    <div
      style={{ background: "#09090b", minHeight: "100vh" }}
      className="flex items-center justify-center"
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="h-10 w-10 rounded-full border-2 border-orange-500 border-t-transparent animate-spin"
        />
        <span className="text-sm text-zinc-500 font-medium">Loading...</span>
      </div>
    </div>
  );
}
