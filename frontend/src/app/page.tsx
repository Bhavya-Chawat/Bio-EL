"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { AlertTriangle, Map as MapIcon, BarChart3, List } from "lucide-react";
import SystemStatusWidget from "@/components/SystemStatusWidget";
import RiskDistributionChart from "@/components/RiskDistributionChart";
import DistrictQuickModal from "@/components/DistrictQuickModal";
import CrisisSimulatorWidget from "@/components/CrisisSimulatorWidget";

// Dynamically import Leaflet map to avoid SSR window errors
const RiskMap = dynamic(() => import("@/components/RiskMap"), { 
  ssr: false,
  loading: () => <div className="flex-1 bg-muted rounded-md flex items-center justify-center border-2 border-dashed border-border"><p className="animate-pulse">Loading Interactive Map...</p></div>
});

type District = {
  id: number;
  lgd_code: string;
  name: string;
  state: string;
  latest_zone: string;
  v_score: number;
};

export default function Dashboard() {
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null);

  useEffect(() => {
    fetch("http://localhost:8000/api/districts?seeded=true")
      .then((res) => res.json())
      .then((data) => {
        setDistricts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const triggerCrisis = (intensity: number) => {
    setLoading(true);
    fetch("http://localhost:8000/api/districts/crisis-spike", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ intensity }),
    })
      .then((res) => res.json())
      .then(() => {
        // Refetch the updated districts from the database
        return fetch("http://localhost:8000/api/districts?seeded=true");
      })
      .then((res) => res.json())
      .then((data) => {
        setDistricts(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error triggering crisis simulation:", err);
        setLoading(false);
      });
  };

  const highRisk = districts.filter(d => d.latest_zone === "high");

  return (
    <div className="min-h-screen bg-background/50 p-4 md:p-8 space-y-6 overflow-x-hidden">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-center bg-gradient-to-r from-primary to-secondary text-primary-foreground p-6 rounded-2xl shadow-xl border border-primary/20">
        <div className="mb-4 md:mb-0">
          <h1 className="text-3xl font-extrabold tracking-tight">BioShield: Epidemiological Early-Warning System</h1>
          <p className="opacity-90 font-medium">Real-time biological hazard and pathogen vector monitoring for flood-prone regions</p>
        </div>
      </header>

      {/* CRITICAL ALERTS */}
      {highRisk.length > 0 && (
        <div className="bg-destructive/10 border-l-4 border-destructive text-destructive-foreground p-4 rounded-r-xl shadow-sm flex items-center gap-4 animate-in slide-in-from-top-4 duration-500">
          <AlertTriangle size={28} className="text-destructive animate-pulse" />
          <div>
            <h2 className="font-bold text-destructive">Critical Alerts</h2>
            <p className="text-destructive/90">{highRisk.length} district(s) are currently in <strong className="uppercase">High Risk</strong> zones.</p>
          </div>
        </div>
      )}

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* LEFT COLUMN: WIDGETS */}
        <div className="lg:col-span-1 space-y-6 flex flex-col">
          <CrisisSimulatorWidget onSimulate={triggerCrisis} />
          
          <div className="bg-card/80 backdrop-blur-md rounded-2xl shadow-lg border p-5 flex-1 hover:shadow-xl transition-shadow duration-300">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-primary border-b pb-2">
              <BarChart3 size={18} />
              National Overview
            </h2>
            {loading ? <p className="text-muted-foreground text-sm">Aggregating data...</p> : <RiskDistributionChart districts={districts} />}
          </div>
          
          <SystemStatusWidget />
        </div>

        {/* CENTER COLUMN: MAP */}
        <div className="lg:col-span-2 bg-card/80 backdrop-blur-md rounded-2xl shadow-lg border p-5 flex flex-col h-[500px] hover:shadow-xl transition-shadow duration-300 relative group">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-primary border-b pb-2 shrink-0">
            <MapIcon size={18} />
            Epidemiological Risk Map
          </h2>
          <div className="flex-1 rounded-xl overflow-hidden shadow-inner relative z-0">
             <RiskMap selectedDistrictId={selectedDistrictId} onDistrictClick={setSelectedDistrictId} />
          </div>
        </div>

        {/* RIGHT COLUMN: LIST */}
        <div className="lg:col-span-1 bg-card/80 backdrop-blur-md rounded-2xl shadow-lg border p-5 flex flex-col h-[500px] hover:shadow-xl transition-shadow duration-300">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-primary border-b pb-2 shrink-0">
            <List size={18} />
            Monitored Districts
          </h2>
          <div className="flex-1 overflow-y-auto pr-2 space-y-2 scrollbar-thin">
            {loading ? (
              <div className="space-y-3">
                {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-muted animate-pulse rounded-xl"></div>)}
              </div>
            ) : (
              districts.map(d => (
                <div 
                  key={d.id} 
                  onClick={() => setSelectedDistrictId(d.id)}
                  className="p-3 rounded-xl border border-transparent hover:border-primary/30 cursor-pointer flex justify-between items-center bg-background shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div>
                    <h3 className="font-semibold text-primary text-sm">{d.name}</h3>
                    <p className="text-xs text-muted-foreground">{d.state}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                    d.latest_zone === 'high' ? 'bg-destructive/10 text-destructive border border-destructive/20' : 
                    d.latest_zone === 'medium' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' : 
                    'bg-green-100 text-green-700 border border-green-200'
                  }`}>
                    {d.latest_zone}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* MODAL (Overlaid) */}
      <DistrictQuickModal 
        districtId={selectedDistrictId} 
        onClose={() => setSelectedDistrictId(null)} 
      />
    </div>
  );
}
