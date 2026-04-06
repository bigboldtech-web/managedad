"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

interface DateRangePickerProps {
  startDate: Date;
  endDate: Date;
  onChange: (start: Date, end: Date) => void;
}

const PRESETS = [
  { label: "Today", getDates: () => { const d = new Date(); d.setHours(0,0,0,0); return [d, new Date()]; } },
  { label: "Yesterday", getDates: () => { const d = new Date(); d.setDate(d.getDate()-1); d.setHours(0,0,0,0); const e = new Date(d); e.setHours(23,59,59,999); return [d, e]; } },
  { label: "This Week", getDates: () => { const d = new Date(); const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1); const s = new Date(d); s.setDate(diff); s.setHours(0,0,0,0); return [s, new Date()]; } },
  { label: "Last 7 days", getDates: () => { const s = new Date(); s.setDate(s.getDate()-7); s.setHours(0,0,0,0); return [s, new Date()]; } },
  { label: "Last 30 days", getDates: () => { const s = new Date(); s.setDate(s.getDate()-30); s.setHours(0,0,0,0); return [s, new Date()]; } },
  { label: "This Month", getDates: () => { const s = new Date(); s.setDate(1); s.setHours(0,0,0,0); return [s, new Date()]; } },
  { label: "Last Month", getDates: () => { const s = new Date(); s.setMonth(s.getMonth()-1); s.setDate(1); s.setHours(0,0,0,0); const e = new Date(s.getFullYear(), s.getMonth()+1, 0, 23, 59, 59, 999); return [s, e]; } },
  { label: "All Time", getDates: () => { const s = new Date(2024, 0, 1); return [s, new Date()]; } },
] as const;

function formatDateShort(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateInput(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}/${dd}/${d.getFullYear()}`;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function isInRange(day: Date, start: Date, end: Date): boolean {
  return day >= start && day <= end;
}

export default function DateRangePicker({ startDate, endDate, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [calMonth, setCalMonth] = useState(startDate.getMonth());
  const [calYear, setCalYear] = useState(startDate.getFullYear());
  const [selecting, setSelecting] = useState<"start" | "end">("start");
  const [tempStart, setTempStart] = useState(startDate);
  const [tempEnd, setTempEnd] = useState(endDate);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function prevMonth() {
    if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); }
    else setCalMonth(calMonth - 1);
  }

  function nextMonth() {
    if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); }
    else setCalMonth(calMonth + 1);
  }

  function handleDayClick(day: Date) {
    if (selecting === "start") {
      setTempStart(day);
      if (day > tempEnd) setTempEnd(day);
      setSelecting("end");
    } else {
      if (day < tempStart) {
        setTempStart(day);
      } else {
        setTempEnd(day);
      }
      setSelecting("start");
    }
  }

  function handleApply() {
    onChange(tempStart, tempEnd);
    setOpen(false);
  }

  function handlePreset(preset: typeof PRESETS[number]) {
    const [s, e] = preset.getDates();
    setTempStart(s as Date);
    setTempEnd(e as Date);
    onChange(s as Date, e as Date);
    setOpen(false);
  }

  // Build calendar grid
  const daysInMonth = getDaysInMonth(calYear, calMonth);
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay();
  const days: (Date | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(calYear, calMonth, i);
    d.setHours(0, 0, 0, 0);
    days.push(d);
  }

  const monthName = new Date(calYear, calMonth).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Trigger button */}
      <button
        onClick={() => { setOpen(!open); setTempStart(startDate); setTempEnd(endDate); setCalMonth(startDate.getMonth()); setCalYear(startDate.getFullYear()); }}
        style={{
          display: "flex", alignItems: "center", gap: "8px", padding: "7px 14px",
          background: "#18181c", border: "1px solid #27272e", borderRadius: "8px",
          color: "#a1a1aa", fontSize: "12px", cursor: "pointer", whiteSpace: "nowrap",
        }}
      >
        <Calendar size={13} color="#52525b" />
        {formatDateShort(startDate)} – {formatDateShort(endDate)}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 50,
          background: "#111114", border: "1px solid #27272e", borderRadius: "12px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)", display: "flex", overflow: "hidden",
          minWidth: "520px",
        }}>
          {/* Presets */}
          <div style={{ padding: "12px 0", borderRight: "1px solid #1f1f25", minWidth: "140px" }}>
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => handlePreset(preset)}
                style={{
                  display: "block", width: "100%", padding: "8px 16px", textAlign: "left",
                  background: "transparent", border: "none", color: "#a1a1aa",
                  fontSize: "12px", cursor: "pointer",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#1f1f25"; e.currentTarget.style.color = "#fafafa"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#a1a1aa"; }}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Calendar */}
          <div style={{ padding: "16px", flex: 1 }}>
            {/* Date inputs */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#3f3f46", marginBottom: "4px" }}>START DATE</div>
                <div style={{
                  padding: "6px 10px", background: selecting === "start" ? "rgba(249,115,22,0.08)" : "#18181c",
                  border: `1px solid ${selecting === "start" ? "rgba(249,115,22,0.3)" : "#27272e"}`,
                  borderRadius: "6px", fontSize: "12px", color: "#fafafa", cursor: "pointer",
                }} onClick={() => setSelecting("start")}>
                  {formatDateInput(tempStart)}
                </div>
              </div>
              <div style={{ alignSelf: "flex-end", padding: "6px 0", color: "#3f3f46", fontSize: "12px" }}>–</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "#3f3f46", marginBottom: "4px" }}>END DATE</div>
                <div style={{
                  padding: "6px 10px", background: selecting === "end" ? "rgba(249,115,22,0.08)" : "#18181c",
                  border: `1px solid ${selecting === "end" ? "rgba(249,115,22,0.3)" : "#27272e"}`,
                  borderRadius: "6px", fontSize: "12px", color: "#fafafa", cursor: "pointer",
                }} onClick={() => setSelecting("end")}>
                  {formatDateInput(tempEnd)}
                </div>
              </div>
            </div>

            {/* Month nav */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <button onClick={prevMonth} style={{ background: "none", border: "none", color: "#52525b", cursor: "pointer", padding: "4px" }}>
                <ChevronLeft size={16} />
              </button>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#fafafa" }}>{monthName}</span>
              <button onClick={nextMonth} style={{ background: "none", border: "none", color: "#52525b", cursor: "pointer", padding: "4px" }}>
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Day headers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px", marginBottom: "4px" }}>
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                <div key={d} style={{ textAlign: "center", fontSize: "10px", fontWeight: 600, color: "#3f3f46", padding: "4px 0" }}>{d}</div>
              ))}
            </div>

            {/* Day grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px" }}>
              {days.map((day, i) => {
                if (!day) return <div key={`empty-${i}`} />;
                const isStart = isSameDay(day, tempStart);
                const isEnd = isSameDay(day, tempEnd);
                const inRange = isInRange(day, tempStart, tempEnd);
                const isToday = isSameDay(day, new Date());
                const isFuture = day > new Date();

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => !isFuture && handleDayClick(day)}
                    disabled={isFuture}
                    style={{
                      width: "32px", height: "32px", display: "flex", alignItems: "center", justifyContent: "center",
                      borderRadius: isStart || isEnd ? "6px" : inRange ? "0" : "6px",
                      background: isStart || isEnd ? "#f97316" : inRange ? "rgba(249,115,22,0.1)" : "transparent",
                      color: isFuture ? "#27272e" : isStart || isEnd ? "#fff" : isToday ? "#f97316" : "#a1a1aa",
                      border: isToday && !isStart && !isEnd ? "1px solid #f97316" : "1px solid transparent",
                      fontSize: "12px", fontWeight: isStart || isEnd ? 700 : 400,
                      cursor: isFuture ? "not-allowed" : "pointer",
                      margin: "0 auto",
                    }}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "14px" }}>
              <button onClick={() => setOpen(false)} style={{
                padding: "6px 16px", background: "transparent", border: "1px solid #27272e",
                borderRadius: "6px", color: "#71717a", fontSize: "12px", cursor: "pointer",
              }}>Cancel</button>
              <button onClick={handleApply} style={{
                padding: "6px 16px", background: "#34d399", border: "none",
                borderRadius: "6px", color: "#fff", fontSize: "12px", fontWeight: 600, cursor: "pointer",
              }}>Apply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
