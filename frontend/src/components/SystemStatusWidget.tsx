"use client";

import { Activity, Server, Clock } from "lucide-react";
import { useEffect, useState } from "react";

export default function SystemStatusWidget() {
  const [uptime, setUptime] = useState("99.99%");
  
  // Dummy interaction for "live" feel
  useEffect(() => {
    const interval = setInterval(() => {
      const isUp = Math.random() > 0.05;
      setUptime(isUp ? "99.99%" : "99.98%");
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-card border rounded-lg shadow-sm p-4 space-y-4">
      <h3 className="font-bold flex items-center gap-2 border-b pb-2">
        <Server size={18} className="text-primary" />
        System Status
      </h3>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="flex items-center gap-2 text-muted-foreground"><Activity size={14}/> Ingestion Engine</span>
          <span className="text-green-600 font-bold flex items-center gap-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            Active
          </span>
        </div>
        
        <div className="flex justify-between items-center text-sm">
          <span className="flex items-center gap-2 text-muted-foreground"><Clock size={14}/> Uptime (30d)</span>
          <span className="font-bold">{uptime}</span>
        </div>
        
        <div className="flex justify-between items-center text-sm">
          <span className="flex items-center gap-2 text-muted-foreground"><Server size={14}/> API Latency</span>
          <span className="font-bold">42ms</span>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 text-blue-800 text-xs rounded-md border border-blue-100">
        <strong>Last sync:</strong> Just now. All OpenWeatherMap and CWC mock adapters are responding optimally.
      </div>
    </div>
  );
}
