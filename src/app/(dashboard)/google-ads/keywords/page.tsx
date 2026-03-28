"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Search } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";

const S = {
  card: { background: "#111114", border: "1px solid #27272e", borderRadius: "12px" },
  input: { height: "38px", padding: "0 12px", background: "#18181c", border: "1px solid #27272e", borderRadius: "7px", color: "#fafafa", fontSize: "13px", outline: "none", fontFamily: "inherit" },
  label: { fontSize: "10px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1px", color: "#3f3f46" },
};

const MATCH_COLORS: Record<string, { bg: string; color: string }> = {
  EXACT:  { bg: "rgba(66,133,244,0.1)",  color: "#4285F4" },
  PHRASE: { bg: "rgba(129,140,248,0.1)", color: "#818cf8" },
  BROAD:  { bg: "rgba(249,115,22,0.1)",  color: "#fb923c" },
};

interface Keyword {
  id: string; text: string; matchType: string; isNegative: boolean; status: string;
  maxCpcBid: number | null; qualityScore: number | null;
  impressions: number; clicks: number; conversions: number; spend: number;
  campaign: { name: string }; adGroup: { name: string } | null;
}

export default function KeywordsPage() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMatchType, setFilterMatchType] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newKeyword, setNewKeyword] = useState("");
  const [newMatchType, setNewMatchType] = useState("EXACT");
  const [newIsNegative, setNewIsNegative] = useState(false);

  useEffect(() => { fetchKeywords(); }, [filterMatchType]);

  async function fetchKeywords() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterMatchType) params.set("matchType", filterMatchType);
      const res = await fetch(`/api/google-ads/keywords?${params}`);
      if (res.ok) setKeywords(await res.json());
    } catch { /* empty */ }
    setLoading(false);
  }

  async function removeKeyword(id: string) {
    const res = await fetch(`/api/google-ads/keywords?id=${id}`, { method: "DELETE" });
    if (res.ok) setKeywords(keywords.filter(k => k.id !== id));
  }

  const filtered = keywords.filter(k => k.text.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h1 style={{ fontFamily: '"Sora", sans-serif', fontSize: "22px", fontWeight: 800, color: "#fafafa", letterSpacing: "-0.5px", marginBottom: "3px" }}>Keyword Manager</h1>
          <p style={{ fontSize: "13px", color: "#52525b" }}>Manage keywords across all your Google Ads campaigns.</p>
        </div>
        <button onClick={() => setShowAddForm(!showAddForm)} style={{ display: "flex", alignItems: "center", gap: "7px", padding: "9px 16px", background: "#f97316", border: "none", borderRadius: "8px", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
          <Plus size={13} /> Add Keywords
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div style={{ ...S.card, padding: "20px 24px" }}>
          <div style={{ fontFamily: '"Sora", sans-serif', fontSize: "14px", fontWeight: 700, color: "#fafafa", marginBottom: "4px" }}>Add Keywords</div>
          <div style={{ fontSize: "12px", color: "#52525b", marginBottom: "16px" }}>One keyword per line.</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <div style={{ ...S.label, marginBottom: "6px" }}>Keywords (one per line)</div>
              <textarea rows={4} placeholder="Enter keywords, one per line..." value={newKeyword} onChange={e => setNewKeyword(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", background: "#18181c", border: "1px solid #27272e", borderRadius: "7px", color: "#fafafa", fontSize: "13px", outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "flex", gap: "16px", alignItems: "flex-end", flexWrap: "wrap" }}>
              <div>
                <div style={{ ...S.label, marginBottom: "6px" }}>Match Type</div>
                <select value={newMatchType} onChange={e => setNewMatchType(e.target.value)}
                  style={{ ...S.input, width: "160px", appearance: "none" as const, cursor: "pointer", paddingRight: "12px" }}>
                  <option value="EXACT">Exact Match</option>
                  <option value="PHRASE">Phrase Match</option>
                  <option value="BROAD">Broad Match</option>
                </select>
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "13px", color: "#a1a1aa", cursor: "pointer", paddingBottom: "1px" }}>
                <input type="checkbox" checked={newIsNegative} onChange={e => setNewIsNegative(e.target.checked)} />
                Negative Keyword
              </label>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => setShowAddForm(false)} style={{ padding: "8px 16px", background: "transparent", border: "1px solid #27272e", borderRadius: "7px", color: "#71717a", fontSize: "13px", cursor: "pointer" }}>Cancel</button>
              <button style={{ padding: "8px 16px", background: "#f97316", border: "none", borderRadius: "7px", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Add Keywords</button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "200px" }}>
          <Search size={13} color="#3f3f46" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
          <input placeholder="Search keywords..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            style={{ ...S.input, width: "100%", paddingLeft: "34px", boxSizing: "border-box" }} />
        </div>
        <select value={filterMatchType} onChange={e => setFilterMatchType(e.target.value)}
          style={{ ...S.input, width: "160px", appearance: "none" as const, cursor: "pointer" }}>
          <option value="">All Match Types</option>
          <option value="EXACT">Exact</option>
          <option value="PHRASE">Phrase</option>
          <option value="BROAD">Broad</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ ...S.card, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #27272e" }}>
          <span style={{ fontFamily: '"Sora", sans-serif', fontSize: "14px", fontWeight: 700, color: "#fafafa" }}>Keywords</span>
          <span style={{ fontSize: "11px", color: "#3f3f46", marginLeft: "8px" }}>{filtered.length} total</span>
        </div>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#3f3f46", fontSize: "13px" }}>Loading keywords...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#3f3f46", fontSize: "13px" }}>No keywords found. Add keywords to your campaigns to get started.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1a1a1f" }}>
                  {["Keyword", "Match", "Campaign", "Status", "QS", "Impressions", "Clicks", "Conv.", "Spend", ""].map((h, i) => (
                    <th key={i} style={{ padding: "10px 16px", textAlign: i >= 4 && i < 9 ? "right" : "left", ...S.label }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(kw => {
                  const mc = MATCH_COLORS[kw.matchType] || { bg: "rgba(113,113,122,0.1)", color: "#71717a" };
                  return (
                    <tr key={kw.id} style={{ borderBottom: "1px solid #1a1a1f" }}>
                      <td style={{ padding: "11px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          {kw.isNegative && (
                            <span style={{ padding: "1px 6px", borderRadius: "4px", fontSize: "9px", fontWeight: 700, background: "rgba(248,113,113,0.1)", color: "#f87171" }}>NEG</span>
                          )}
                          <span style={{ color: "#fafafa", fontWeight: 500 }}>{kw.text}</span>
                        </div>
                      </td>
                      <td style={{ padding: "11px 16px" }}>
                        <span style={{ padding: "2px 7px", borderRadius: "4px", fontSize: "10px", fontWeight: 700, background: mc.bg, color: mc.color }}>{kw.matchType}</span>
                      </td>
                      <td style={{ padding: "11px 16px", color: "#71717a" }}>{kw.campaign.name}</td>
                      <td style={{ padding: "11px 16px" }}>
                        <span style={{ padding: "2px 7px", borderRadius: "4px", fontSize: "10.5px", fontWeight: 700, background: kw.status === "ACTIVE" ? "rgba(52,211,153,0.1)" : "rgba(113,113,122,0.1)", color: kw.status === "ACTIVE" ? "#34d399" : "#71717a" }}>{kw.status}</span>
                      </td>
                      <td style={{ padding: "11px 16px", textAlign: "right", color: "#71717a" }}>{kw.qualityScore ?? "—"}</td>
                      <td style={{ padding: "11px 16px", textAlign: "right", color: "#a1a1aa" }}>{formatNumber(kw.impressions)}</td>
                      <td style={{ padding: "11px 16px", textAlign: "right", color: "#a1a1aa" }}>{formatNumber(kw.clicks)}</td>
                      <td style={{ padding: "11px 16px", textAlign: "right", color: "#a1a1aa" }}>{kw.conversions}</td>
                      <td style={{ padding: "11px 16px", textAlign: "right", color: "#fafafa", fontWeight: 500 }}>{formatCurrency(kw.spend)}</td>
                      <td style={{ padding: "11px 16px" }}>
                        <button onClick={() => removeKeyword(kw.id)} title="Remove" style={{ width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "none", borderRadius: "6px", cursor: "pointer", color: "#52525b" }}
                          onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
                          onMouseLeave={e => (e.currentTarget.style.color = "#52525b")}>
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
