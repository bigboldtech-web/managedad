import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import "../marketing.css";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main style={{ background: "#09090b", minHeight: "100vh", paddingTop: "72px" }}>
        {children}
      </main>
      <Footer />
    </>
  );
}
