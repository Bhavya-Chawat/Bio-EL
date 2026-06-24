"use client";

import { useState } from "react";
import { Zap, Skull, RefreshCw, Archive } from "lucide-react";

export default function CrisisSimulatorWidget({ onSimulate }: { onSimulate: (intensity: number) => void }) {
  const [intensity, setIntensity] = useState(50);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulate = () => {
    setIsSimulating(true);
    // Fake an API call delay for effect
    setTimeout(() => {
      onSimulate(intensity);
      setIsSimulating(false);
    }, 800);
  };

  const [isReplaying, setIsReplaying] = useState(false);

  const handleReplay = async () => {
    setIsReplaying(true);
    try {
      const res = await fetch("http://localhost:8000/api/replay/kerala_2018/run", {
        method: "POST"
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Historical Replay Complete: ${data.event}\n\nAccuracy: ${data.metrics.accuracy_pct}%\nTotal Predictions: ${data.metrics.total_predictions}\nHigh Risk Accuracy: ${data.metrics.high_risk_accuracy_pct}%`);
      } else {
        alert(`Error: ${data.detail || "Failed to run replay"}`);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to connect to backend for historical replay.");
    } finally {
      setIsReplaying(false);
    }
  };

  return (
    <div className="bg-card/90 backdrop-blur-md border rounded-2xl shadow-lg p-5 flex-1 relative overflow-hidden group">
      {/* Decorative background element */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-destructive/10 rounded-full blur-2xl group-hover:bg-destructive/20 transition-all duration-500 pointer-events-none"></div>

      <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-destructive border-b border-destructive/20 pb-2">
        <Skull size={18} />
        Live Crisis Simulator
      </h2>
      
      <div className="space-y-4 relative z-10">
        <div>
          <label className="flex justify-between text-sm font-semibold mb-1 text-muted-foreground">
            <span>Disaster Intensity (Monsoon Spike)</span>
            <span>{intensity}%</span>
          </label>
          <input 
            type="range" 
            min="10" 
            max="100" 
            value={intensity} 
            onChange={(e) => setIntensity(Number(e.target.value))}
            className="w-full accent-destructive cursor-pointer"
          />
        </div>

        <button 
          onClick={handleSimulate}
          disabled={isSimulating}
          className="w-full bg-destructive text-destructive-foreground font-bold py-2.5 rounded-lg shadow hover:bg-destructive/90 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70"
        >
          {isSimulating ? <RefreshCw className="animate-spin" size={18} /> : <Zap size={18} />}
          {isSimulating ? "Spiking Telemetry..." : "Trigger Crisis Protocol"}
        </button>

        <div className="pt-2 border-t mt-4 border-border">
          <button 
            onClick={handleReplay}
            disabled={isReplaying}
            className="w-full bg-secondary text-secondary-foreground font-bold py-2 rounded-lg shadow-sm hover:opacity-90 transition flex items-center justify-center gap-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isReplaying ? <RefreshCw className="animate-spin" size={16} /> : <Archive size={16} />}
            {isReplaying ? "Running Replay..." : "Run Historical Replay"}
          </button>
        </div>
      </div>
    </div>
  );
}
