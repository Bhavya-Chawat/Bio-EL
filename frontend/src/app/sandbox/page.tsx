/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine,
} from "recharts";
import {
  Archive, Play, Pause, RotateCcw, ChevronRight,
  Gauge, Clock, AlertCircle, Zap, Users, MapPin,
  SkipForward, Flame,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EventMeta {
  id: string;
  title: string;
  year: number;
  color: string;
  icon: string;
  severity: string;
  start_date: string;
  end_date: string;
  description: string;
  districts_affected: string[];
  casualties: number;
  displaced: number;
  days: number;
}

interface DistrictFrame {
  district: string;
  rainfall_mm: number;
  river_level_m: number;
  w_score: number;
  e_score: number;
  v_score: number;
  r_score: number;
  predicted_zone: string;
  actual_zone: string;
  has_outbreak: boolean;
  outbreak_disease?: string;
}

interface DayFrame {
  day: string;
  date: string;
  districts: DistrictFrame[];
}

interface ReplayResult {
  event: string;
  timeline: DayFrame[];
  metrics: {
    accuracy_pct: number;
    avg_lead_time_hours: number;
    false_positive_pct: number;
    total_predictions: number;
    correct_predictions: number;
    high_risk_accuracy_pct: number;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ZONE_COLOR: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#22c55e",
};

const DISTRICT_COLORS = [
  "#60a5fa", "#f472b6", "#a78bfa", "#34d399", "#fb923c",
];

function zoneToNum(zone: string): number {
  return zone === "high" ? 3 : zone === "medium" ? 2 : 1;
}

function buildChartData(timeline: DayFrame[], visibleDay: number) {
  return timeline.slice(0, visibleDay + 1).map((frame) => {
    const row: Record<string, any> = { day: frame.day };
    frame.districts.forEach((d) => {
      row[`${d.district}_pred`] = d.r_score;
      row[`${d.district}_actual`] = zoneToNum(d.actual_zone) * d.v_score;
    });
    return row;
  });
}

const SPEEDS = [0.5, 1, 1.5, 2];

// ─── Component ────────────────────────────────────────────────────────────────

export default function Sandbox() {
  const [events, setEvents] = useState<EventMeta[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ReplayResult | null>(null);
  const [visibleDay, setVisibleDay] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load events on mount
  useEffect(() => {
    fetch("http://localhost:8000/api/replay/events")
      .then((r) => r.json())
      .then(setEvents)
      .catch(() => setError("Could not connect to backend."));
  }, []);

  // Playback ticker
  const stopPlayback = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setIsPlaying(false);
  }, []);

  const startPlayback = useCallback(() => {
    if (!result) return;
    const totalDays = result.timeline.length;
    setIsPlaying(true);
    intervalRef.current = setInterval(() => {
      setVisibleDay((prev) => {
        if (prev >= totalDays - 1) {
          stopPlayback();
          return prev;
        }
        return prev + 1;
      });
    }, Math.round(900 / speed));
  }, [result, speed, stopPlayback]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Restart playback when speed changes while playing
  useEffect(() => {
    if (isPlaying) {
      stopPlayback();
      startPlayback();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speed]);

  const runReplay = async () => {
    if (!selectedEvent) return;
    setRunning(true);
    setResult(null);
    setVisibleDay(0);
    setError(null);
    stopPlayback();
    try {
      const res = await fetch(`http://localhost:8000/api/replay/${selectedEvent}/run`, {
        method: "POST",
      });
      if (!res.ok) throw new Error(await res.text());
      const data: ReplayResult = await res.json();
      setResult(data);
      setVisibleDay(0);
      // Auto-start playback after short delay
      setTimeout(() => {
        setIsPlaying(true);
        intervalRef.current = setInterval(() => {
          setVisibleDay((prev) => {
            if (prev >= data.timeline.length - 1) {
              stopPlayback();
              return prev;
            }
            return prev + 1;
          });
        }, Math.round(900 / speed));
      }, 600);
    } catch (e: any) {
      setError(e.message || "Replay failed");
    } finally {
      setRunning(false);
    }
  };

  const reset = () => {
    stopPlayback();
    setVisibleDay(0);
  };

  const selectedEventMeta = events.find((e) => e.id === selectedEvent);
  const currentFrame = result?.timeline[visibleDay];
  const chartData = result ? buildChartData(result.timeline, visibleDay) : [];
  const districts = result?.timeline[0]?.districts?.map((d) => d.district) ?? [];

  // Zone badge
  const ZoneBadge = ({ zone }: { zone: string }) => (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
        zone === "high"
          ? "bg-red-500/20 text-red-400 border border-red-500/30"
          : zone === "medium"
          ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
          : "bg-green-500/20 text-green-400 border border-green-500/30"
      }`}
    >
      {zone}
    </span>
  );

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white p-4 md:p-8 space-y-6 font-sans">

      {/* ── HEADER ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1a1f3e] via-[#0f172a] to-[#0a0f1e] border border-white/10 rounded-2xl p-8 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/10 to-pink-600/10 pointer-events-none" />
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-500/20 rounded-xl border border-blue-500/30">
                <Archive size={24} className="text-blue-400" />
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Historical Replay Engine
              </h1>
            </div>
            <p className="text-slate-400 text-sm md:text-base max-w-xl">
              Simulate past flood disasters through the live BioShield risk pipeline. Watch how predicted zones evolved against real outbreak data — day by day.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 text-sm font-semibold">Risk Engine Online</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-center gap-3 text-red-400 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── LEFT SIDEBAR ── */}
        <div className="lg:col-span-1 space-y-4">

          {/* Event Cards */}
          <div className="bg-[#111827] border border-white/10 rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Flame size={14} className="text-orange-400" /> Replay Scenarios
            </h2>
            {events.length === 0 ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              events.map((evt) => (
                <button
                  key={evt.id}
                  onClick={() => {
                    setSelectedEvent(evt.id);
                    setResult(null);
                    setVisibleDay(0);
                    stopPlayback();
                  }}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 group relative overflow-hidden ${
                    selectedEvent === evt.id
                      ? "border-blue-500/50 bg-blue-500/10 shadow-lg shadow-blue-500/10"
                      : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                  }`}
                >
                  {selectedEvent === evt.id && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 pointer-events-none" />
                  )}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{evt.icon}</span>
                        <h3 className="font-bold text-white text-sm">{evt.title}</h3>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        <span className="text-[10px] bg-white/10 text-slate-300 px-2 py-0.5 rounded-full">
                          {evt.year}
                        </span>
                        <span className="text-[10px] bg-orange-500/20 text-orange-400 border border-orange-500/30 px-2 py-0.5 rounded-full font-semibold">
                          {evt.severity}
                        </span>
                        <span className="text-[10px] bg-white/10 text-slate-300 px-2 py-0.5 rounded-full">
                          {evt.days} days
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {evt.description}
                      </p>
                    </div>
                    <ChevronRight
                      size={16}
                      className={`mt-1 shrink-0 transition-transform ${
                        selectedEvent === evt.id ? "text-blue-400 translate-x-0.5" : "text-slate-600"
                      }`}
                    />
                  </div>
                  <div className="mt-3 flex gap-3 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Users size={10} /> {evt.casualties?.toLocaleString()} casualties
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={10} /> {evt.districts_affected?.length} districts
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Execute Button */}
          <button
            onClick={runReplay}
            disabled={!selectedEvent || running}
            className={`w-full relative overflow-hidden py-4 rounded-xl font-black text-base tracking-wide transition-all duration-300 flex items-center justify-center gap-3 ${
              !selectedEvent || running
                ? "bg-white/5 text-slate-600 border border-white/10 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98]"
            }`}
          >
            {running ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Simulating Pipeline...
              </>
            ) : (
              <>
                <Play size={18} />
                Execute Historical Replay
              </>
            )}
          </button>

          {/* Event Info Card */}
          {selectedEventMeta && (
            <div className="bg-[#111827] border border-white/10 rounded-2xl p-5 space-y-3 text-sm">
              <h3 className="font-bold text-slate-300 flex items-center gap-2">
                <Zap size={14} className="text-yellow-400" /> Event Details
              </h3>
              <div className="space-y-2 text-slate-400">
                <div className="flex justify-between">
                  <span>Period</span>
                  <span className="text-white font-medium">{selectedEventMeta.start_date} → {selectedEventMeta.end_date}</span>
                </div>
                <div className="flex justify-between">
                  <span>Casualties</span>
                  <span className="text-red-400 font-bold">{selectedEventMeta.casualties?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Displaced</span>
                  <span className="text-orange-400 font-bold">{selectedEventMeta.displaced?.toLocaleString()}</span>
                </div>
                <div>
                  <span className="block mb-1 text-slate-400">Affected Districts</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedEventMeta.districts_affected.map((d) => (
                      <span key={d} className="text-[10px] bg-white/10 text-slate-300 px-2 py-0.5 rounded-full">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT: RESULTS ── */}
        <div className="lg:col-span-2 space-y-4">

          {!result ? (
            <div className="bg-[#111827] border border-white/10 rounded-2xl min-h-[540px] flex flex-col items-center justify-center text-slate-600 space-y-4">
              <Archive size={56} className="opacity-20" />
              <div className="text-center space-y-1">
                <p className="font-semibold text-slate-500">No replay running</p>
                <p className="text-sm">Select a scenario from the left and click Execute Historical Replay</p>
              </div>
            </div>
          ) : (
            <>
              {/* Metrics Row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    label: "Prediction Accuracy",
                    value: `${result.metrics.accuracy_pct}%`,
                    icon: <Gauge size={18} className="text-green-400" />,
                    color: "green",
                  },
                  {
                    label: "Avg Lead Time",
                    value: `${result.metrics.avg_lead_time_hours}h`,
                    icon: <Clock size={18} className="text-blue-400" />,
                    color: "blue",
                  },
                  {
                    label: "False Positives",
                    value: `${result.metrics.false_positive_pct}%`,
                    icon: <AlertCircle size={18} className="text-purple-400" />,
                    color: "purple",
                  },
                ].map((m) => (
                  <div
                    key={m.label}
                    className={`bg-[#111827] border border-white/10 rounded-2xl p-4 flex flex-col gap-2`}
                  >
                    <div className="flex items-center gap-2">
                      {m.icon}
                      <span className="text-[11px] text-slate-400 font-medium">{m.label}</span>
                    </div>
                    <p className="text-2xl font-black text-white">{m.value}</p>
                  </div>
                ))}
              </div>

              {/* Current Day Snapshot */}
              {currentFrame && (
                <div className="bg-[#111827] border border-white/10 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-white text-lg">
                        Day {visibleDay + 1} — {currentFrame.day}
                      </h3>
                      <p className="text-slate-500 text-xs">{currentFrame.date}</p>
                    </div>
                    {/* Playback Controls */}
                    <div className="flex items-center gap-2">
                      {/* Speed Selector */}
                      <div className="flex items-center bg-white/5 border border-white/10 rounded-lg overflow-hidden text-xs">
                        {SPEEDS.map((s) => (
                          <button
                            key={s}
                            onClick={() => setSpeed(s)}
                            className={`px-2.5 py-1.5 font-semibold transition-colors ${
                              speed === s
                                ? "bg-blue-600 text-white"
                                : "text-slate-400 hover:text-white"
                            }`}
                          >
                            {s}×
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={reset}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-colors"
                        title="Reset"
                      >
                        <RotateCcw size={14} />
                      </button>
                      <button
                        onClick={() => setVisibleDay((v) => Math.min(v + 1, result.timeline.length - 1))}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-colors"
                        title="Step Forward"
                      >
                        <SkipForward size={14} />
                      </button>
                      <button
                        onClick={() => (isPlaying ? stopPlayback() : startPlayback())}
                        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm flex items-center gap-2 transition-colors"
                      >
                        {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                        {isPlaying ? "Pause" : "Play"}
                      </button>
                    </div>
                  </div>

                  {/* Timeline Scrubber */}
                  <div className="mb-4 space-y-1">
                    <input
                      type="range"
                      min={0}
                      max={result.timeline.length - 1}
                      value={visibleDay}
                      onChange={(e) => {
                        stopPlayback();
                        setVisibleDay(Number(e.target.value));
                      }}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
                          (visibleDay / (result.timeline.length - 1)) * 100
                        }%, #1f2937 ${(visibleDay / (result.timeline.length - 1)) * 100}%, #1f2937 100%)`,
                      }}
                    />
                    <div className="flex justify-between text-[10px] text-slate-600">
                      <span>{result.timeline[0]?.day}</span>
                      <span>{result.timeline[result.timeline.length - 1]?.day}</span>
                    </div>
                  </div>

                  {/* District risk pills for current day */}
                  <div className="flex flex-wrap gap-2">
                    {currentFrame.districts.map((d, i) => (
                      <div
                        key={d.district}
                        className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs"
                        style={{ borderLeftColor: DISTRICT_COLORS[i % DISTRICT_COLORS.length], borderLeftWidth: 3 }}
                      >
                        <div>
                          <span className="font-semibold text-white">{d.district}</span>
                          <div className="flex gap-1.5 mt-0.5 items-center">
                            <span className="text-slate-500">Pred:</span>
                            <ZoneBadge zone={d.predicted_zone} />
                            <span className="text-slate-500 ml-1">Act:</span>
                            <ZoneBadge zone={d.actual_zone} />
                            {d.has_outbreak && (
                              <span className="text-red-400 font-bold">⚠ {d.outbreak_disease}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chart */}
              <div className="bg-[#111827] border border-white/10 rounded-2xl p-5">
                <h3 className="font-bold text-white mb-1 text-sm">Risk Score Timeline</h3>
                <p className="text-slate-500 text-xs mb-4">Predicted R-Score per district — solid = predicted, dashed = actual severity index</p>
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis
                        dataKey="day"
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "#1e293b",
                          border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: "12px",
                          fontSize: "12px",
                          color: "#e2e8f0",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "12px" }} />
                      {districts.map((d, i) => (
                        <Line
                          key={`${d}_pred`}
                          type="monotone"
                          dataKey={`${d}_pred`}
                          name={`${d} (predicted)`}
                          stroke={DISTRICT_COLORS[i % DISTRICT_COLORS.length]}
                          strokeWidth={2.5}
                          dot={false}
                          activeDot={{ r: 4 }}
                          isAnimationActive={false}
                        />
                      ))}
                      {districts.map((d, i) => (
                        <Line
                          key={`${d}_actual`}
                          type="monotone"
                          dataKey={`${d}_actual`}
                          name={`${d} (actual)`}
                          stroke={DISTRICT_COLORS[i % DISTRICT_COLORS.length]}
                          strokeWidth={1.5}
                          strokeDasharray="4 4"
                          dot={false}
                          opacity={0.5}
                          isAnimationActive={false}
                        />
                      ))}
                      {currentFrame && (
                        <ReferenceLine
                          x={currentFrame.day}
                          stroke="rgba(255,255,255,0.3)"
                          strokeDasharray="2 2"
                          label={{ value: "▼", fill: "#94a3b8", fontSize: 10, position: "top" }}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
