"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, TrendingDown, TrendingUp, Pause, AlertCircle } from "lucide-react";

const S = {
  card: { background: "#111114", border: "1px solid #27272e", borderRadius: "12px" },
};

interface ActionButton {
  label: string;
  type: "danger" | "success" | "warning";
  action: string;
  campaignId: string | null;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions?: ActionButton[];
  timestamp: string;
  streaming?: boolean;
}

const SUGGESTED = [
  "Which campaigns are wasting money?",
  "What's my best performing campaign?",
  "Where should I increase budget?",
  "Show me campaigns with frequency issues",
  "What negatives should I add today?",
  "Which keywords have the worst quality score?",
  "Give me an account health summary",
  "What's my ROAS trend this week?",
];

function renderContent(content: string, streaming?: boolean) {
  const lines = content.split("\n");
  return (
    <>
      {lines.map((line, i) => {
        const html = line
          .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#fafafa;font-weight:700">$1</strong>')
          .replace(/`(.*?)`/g, '<code style="background:#1f1f25;padding:1px 5px;border-radius:4px;font-size:12px;color:#fb923c">$1</code>');
        return <p key={i} style={{ margin: "2px 0", lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: html }} />;
      })}
      {streaming && (
        <span
          style={{
            display: "inline-block",
            width: "2px",
            height: "14px",
            background: "#f97316",
            marginLeft: "2px",
            verticalAlign: "text-bottom",
            animation: "blink 0.8s step-end infinite",
          }}
        />
      )}
    </>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hey! I'm your AI ad manager. I have full access to your Google Ads and Meta campaign data in real time.\n\nAsk me anything — wasted spend, ROAS analysis, budget recommendations, keyword issues. What would you like to know?",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text?: string) {
    const q = (text ?? input).trim();
    if (!q || loading) return;
    setInput("");
    setError(null);

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: q,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setLoading(true);

    const assistantId = (Date.now() + 1).toString();
    const assistantTimestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages
            .filter((m) => m.id !== "welcome")
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) throw new Error("API error");

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      // Add empty streaming assistant message
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: "assistant",
          content: "",
          actions: [],
          timestamp: assistantTimestamp,
          streaming: true,
        },
      ]);

      let assistantContent = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        // Keep the last part as buffer (may be incomplete)
        buffer = parts.pop() || "";

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data: ")) continue;

          try {
            const data = JSON.parse(line.slice(6));

            if (data.type === "delta") {
              assistantContent += data.text;
              const currentContent = assistantContent;
              setMessages((prev) => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                updated[lastIdx] = {
                  ...updated[lastIdx],
                  content: currentContent,
                  streaming: true,
                };
                return updated;
              });
            } else if (data.type === "done") {
              setMessages((prev) => {
                const updated = [...prev];
                const lastIdx = updated.length - 1;
                updated[lastIdx] = {
                  ...updated[lastIdx],
                  content: data.content,
                  actions: data.actions ?? [],
                  streaming: false,
                };
                return updated;
              });
            } else if (data.type === "error") {
              setError(data.message || "Stream interrupted. Please try again.");
            }
          } catch {
            // skip malformed SSE data
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim().startsWith("data: ")) {
        try {
          const data = JSON.parse(buffer.trim().slice(6));
          if (data.type === "done") {
            setMessages((prev) => {
              const updated = [...prev];
              const lastIdx = updated.length - 1;
              updated[lastIdx] = {
                ...updated[lastIdx],
                content: data.content,
                actions: data.actions ?? [],
                streaming: false,
              };
              return updated;
            });
          }
        } catch {
          // skip
        }
      }

      // Ensure streaming flag is off
      setMessages((prev) => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (updated[lastIdx]?.streaming) {
          updated[lastIdx] = { ...updated[lastIdx], streaming: false };
        }
        return updated;
      });
    } catch {
      setError("Failed to get a response. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const actionIcon = (type: string) => {
    if (type === "danger") return <Pause size={10} style={{ display: "inline", marginRight: "4px" }} />;
    if (type === "success") return <TrendingUp size={10} style={{ display: "inline", marginRight: "4px" }} />;
    return <TrendingDown size={10} style={{ display: "inline", marginRight: "4px" }} />;
  };

  const actionStyle = (type: string): React.CSSProperties => ({
    padding: "6px 12px", borderRadius: "6px", fontSize: "11.5px", fontWeight: 600,
    cursor: "pointer", border: "1px solid",
    background: type === "danger" ? "rgba(248,113,113,0.1)" : type === "success" ? "rgba(52,211,153,0.1)" : "rgba(251,191,36,0.1)",
    borderColor: type === "danger" ? "rgba(248,113,113,0.3)" : type === "success" ? "rgba(52,211,153,0.3)" : "rgba(251,191,36,0.3)",
    color: type === "danger" ? "#f87171" : type === "success" ? "#34d399" : "#fbbf24",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 100px)" }}>
      {/* Blinking cursor animation */}
      <style>{`@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }`}</style>

      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontFamily: '"Sora", sans-serif', fontSize: "22px", fontWeight: 800, color: "#fafafa", letterSpacing: "-0.5px", marginBottom: "3px" }}>AI Chat</h1>
        <p style={{ fontSize: "13px", color: "#52525b" }}>Ask anything about your campaigns. AI pulls live data from your accounts.</p>
      </div>

      <div style={{ display: "flex", gap: "16px", flex: 1, minHeight: 0 }}>
        {/* Suggested */}
        <div style={{ width: "220px", flexShrink: 0 }}>
          <div style={{ ...S.card, padding: "14px" }}>
            <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "1px", color: "#3f3f46", marginBottom: "10px" }}>Quick Ask</div>
            {SUGGESTED.map((q) => (
              <button key={q} onClick={() => sendMessage(q)} style={{
                display: "block", width: "100%", textAlign: "left" as const, padding: "8px 10px", marginBottom: "4px",
                background: "transparent", border: "1px solid #1a1a1f", borderRadius: "7px",
                color: "#71717a", fontSize: "12px", cursor: "pointer", lineHeight: 1.4,
              }}
                onMouseEnter={(e) => { const el = e.currentTarget; el.style.borderColor = "rgba(249,115,22,0.3)"; el.style.color = "#fb923c"; el.style.background = "rgba(249,115,22,0.04)"; }}
                onMouseLeave={(e) => { const el = e.currentTarget; el.style.borderColor = "#1a1a1f"; el.style.color = "#71717a"; el.style.background = "transparent"; }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Chat window */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", ...S.card, overflow: "hidden" }}>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
            {messages.map((msg) => (
              <div key={msg.id} style={{ display: "flex", gap: "10px", alignItems: "flex-start", flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
                <div style={{
                  width: "30px", height: "30px", borderRadius: "50%", flexShrink: 0,
                  background: msg.role === "assistant" ? "linear-gradient(135deg, #f97316, #fb923c)" : "#27272e",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {msg.role === "assistant" ? <Bot size={14} color="#fff" /> : <User size={14} color="#a1a1aa" />}
                </div>
                <div style={{ maxWidth: "78%", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{
                    padding: "12px 16px",
                    borderRadius: msg.role === "user" ? "12px 4px 12px 12px" : "4px 12px 12px 12px",
                    background: msg.role === "user" ? "rgba(249,115,22,0.1)" : "#18181c",
                    border: `1px solid ${msg.role === "user" ? "rgba(249,115,22,0.2)" : "#27272e"}`,
                    fontSize: "13px", color: "#a1a1aa", lineHeight: 1.6,
                  }}>
                    {renderContent(msg.content, msg.streaming)}
                  </div>
                  {msg.actions && msg.actions.length > 0 && !msg.streaming && (
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" as const }}>
                      {msg.actions.map((action) => (
                        <button key={action.label} style={actionStyle(action.type)}>
                          {actionIcon(action.type)}{action.label}
                        </button>
                      ))}
                    </div>
                  )}
                  <span style={{ fontSize: "10.5px", color: "#3f3f46", alignSelf: msg.role === "user" ? "flex-end" : "flex-start" }}>{msg.timestamp}</span>
                </div>
              </div>
            ))}

            {loading && !messages[messages.length - 1]?.streaming && (
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "linear-gradient(135deg, #f97316, #fb923c)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Bot size={14} color="#fff" />
                </div>
                <div style={{ padding: "14px 16px", background: "#18181c", border: "1px solid #27272e", borderRadius: "4px 12px 12px 12px" }}>
                  <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                    {[0, 1, 2].map((i) => (
                      <div key={i} style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#f97316", animation: "pulse 1.2s ease-in-out infinite", animationDelay: `${i * 0.25}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div style={{ display: "flex", gap: "8px", alignItems: "center", padding: "10px 14px", background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "8px", fontSize: "13px", color: "#f87171" }}>
                <AlertCircle size={13} />
                {error}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "16px", borderTop: "1px solid #27272e", display: "flex", gap: "10px" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Ask anything about your campaigns..."
              disabled={loading}
              style={{ flex: 1, height: "44px", padding: "0 16px", background: "#18181c", border: "1px solid #27272e", borderRadius: "10px", color: "#fafafa", fontSize: "13.5px", outline: "none", opacity: loading ? 0.6 : 1 }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              style={{ width: "44px", height: "44px", background: loading || !input.trim() ? "rgba(249,115,22,0.3)" : "#f97316", border: "none", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", cursor: loading || !input.trim() ? "not-allowed" : "pointer", flexShrink: 0 }}
            >
              <Send size={16} color="#fff" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
