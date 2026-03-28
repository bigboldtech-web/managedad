export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#09090b",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Radial glow behind the card */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -60%)",
          width: "600px",
          height: "600px",
          background:
            "radial-gradient(circle, rgba(124,92,252,0.10) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div style={{ width: "100%", maxWidth: "440px", position: "relative" }}>
        {children}
      </div>
    </div>
  );
}
