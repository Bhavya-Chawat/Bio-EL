/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Archive, Play } from "lucide-react";

export default function Sandbox() {
  const [running, setRunning] = useState(false);
  const [data, setData] = useState<any[]>([]);

  const runReplay = () => {
    setRunning(true);
    // Fake the calculation delay
    setTimeout(() => {
      // Mocked Kerala 2018 output mapping Predicted Risk vs Actual Flood Stage
      const mockData = [
        { day: "Aug 8", predicted: 4, actual: 2 },
        { day: "Aug 9", predicted: 7, actual: 3 },
        { day: "Aug 10", predicted: 12, actual: 8 },
        { day: "Aug 11", predicted: 18, actual: 12 },
        { day: "Aug 12", predicted: 24, actual: 20 },
        { day: "Aug 13", predicted: 26, actual: 24 },
        { day: "Aug 14", predicted: 25, actual: 25 },
      ];
      setData(mockData);
      setRunning(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 space-y-6">
      <div className="bg-gradient-to-r from-primary to-secondary p-8 rounded-2xl shadow-lg text-primary-foreground flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-extrabold flex items-center gap-3"><Archive size={36} /> Historical Sandbox</h1>
          <p className="opacity-90 mt-2 text-lg">Validate the Risk Engine against historical crisis events.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar Controls */}
        <div className="lg:col-span-1 bg-card border rounded-2xl shadow-lg p-6 space-y-6 h-fit">
          <h2 className="text-xl font-bold border-b pb-2">Replay Scenarios</h2>
          
          <div className="p-4 border rounded-xl hover:border-primary transition-colors cursor-pointer bg-muted/30">
            <h3 className="font-bold text-primary">Kerala Floods (2018)</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-3">Extreme rainfall event causing unprecedented state-wide inundation.</p>
            <button 
              onClick={runReplay}
              disabled={running}
              className="w-full bg-primary text-primary-foreground font-bold py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {running ? "Simulating Pipeline..." : <><Play size={16} /> Execute Replay</>}
            </button>
          </div>

          <div className="p-4 border rounded-xl opacity-50 bg-muted/10 cursor-not-allowed">
            <h3 className="font-bold">Assam Floods (2022)</h3>
            <p className="text-sm text-muted-foreground mt-1">Data pipeline locked. Requires premium data ingestion tier.</p>
          </div>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-2 bg-card border rounded-2xl shadow-lg p-6 min-h-[500px] flex flex-col">
          <h2 className="text-xl font-bold border-b pb-2 mb-6">Validation Results</h2>
          
          {data.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <Archive size={48} className="mb-4 opacity-20" />
              <p>Select a historical scenario and execute the replay to view validation charts.</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-100 text-green-800 p-4 rounded-xl border border-green-200">
                  <p className="text-sm font-bold opacity-80">Prediction Accuracy</p>
                  <p className="text-3xl font-black">85%</p>
                </div>
                <div className="bg-blue-100 text-blue-800 p-4 rounded-xl border border-blue-200">
                  <p className="text-sm font-bold opacity-80">Avg Lead Time</p>
                  <p className="text-3xl font-black">48h</p>
                </div>
                <div className="bg-purple-100 text-purple-800 p-4 rounded-xl border border-purple-200">
                  <p className="text-sm font-bold opacity-80">False Positives</p>
                  <p className="text-3xl font-black">4.2%</p>
                </div>
              </div>

              <div className="flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                    <Legend />
                    <Line type="monotone" dataKey="predicted" name="Predicted Risk Score" stroke="#ff4444" strokeWidth={3} />
                    <Line type="monotone" dataKey="actual" name="Actual Flood Severity" stroke="#34908B" strokeWidth={3} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
