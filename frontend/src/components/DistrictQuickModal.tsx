/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Droplets, Activity, Thermometer, ShieldAlert, Bug, Flame } from "lucide-react";

export default function DistrictQuickModal({ districtId, onClose }: { districtId: number | null, onClose: () => void }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!districtId) return;
    setLoading(true);
    fetch(`http://localhost:8000/api/districts/${districtId}`)
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      });
  }, [districtId]);

  if (!districtId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-opacity duration-300">
      <div 
        className="bg-card text-card-foreground w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        <div className="p-6 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={20} />
          </button>
          
          {loading ? (
            <div className="h-40 flex items-center justify-center">Loading...</div>
          ) : data ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-primary">{data.name}</h2>
                <p className="text-sm text-muted-foreground">{data.state}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted p-3 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><Droplets size={12}/> 24h Rainfall</p>
                  <p className="font-bold text-lg">{data.weather.rainfall_mm_24h?.toFixed(1) || 0} mm</p>
                </div>
                <div className="bg-muted p-3 rounded-lg border border-border">
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1"><Activity size={12}/> River Stage</p>
                  <p className="font-bold text-lg text-destructive">{data.river.level_m?.toFixed(2) || 0} m</p>
                </div>
              </div>

              {/* Biosafety Matrix */}
              <div className={`p-4 rounded-xl border ${
                data.current_risk.zone === 'high' ? 'bg-destructive/10 border-destructive/30' : 
                data.current_risk.zone === 'medium' ? 'bg-yellow-500/10 border-yellow-500/30' : 
                'bg-primary/10 border-primary/30'
              }`}>
                <h4 className="text-sm font-black uppercase mb-3 flex items-center gap-2">
                  <Bug size={16} /> Epidemiological Threat Matrix
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-semibold flex items-center gap-2"><Thermometer size={14}/> Primary Pathogen Vector</span>
                    <span className="font-bold text-foreground">
                      {data.current_risk.zone === 'high' ? 'Waterborne (V. cholerae)' : data.current_risk.zone === 'medium' ? 'Zoonotic (Leptospira)' : 'Vector-borne (Dengue)'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-semibold flex items-center gap-2"><ShieldAlert size={14}/> Recommended Precautions</span>
                    <span className="font-bold text-foreground">
                      {data.current_risk.zone === 'high' ? 'BSL-2 / Doxycycline Prophylaxis' : 'Standard PPE & Mosquito Nets'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-semibold flex items-center gap-2"><Flame size={14}/> Contamination Risk Index</span>
                    <span className={`font-black uppercase ${
                      data.current_risk.zone === 'high' ? 'text-destructive' : data.current_risk.zone === 'medium' ? 'text-yellow-600' : 'text-primary'
                    }`}>
                      {data.current_risk.zone === 'high' ? 'CRITICAL (9.4/10)' : data.current_risk.zone === 'medium' ? 'ELEVATED (6.2/10)' : 'BASELINE (2.1/10)'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button onClick={onClose} className="px-4 py-2 rounded-lg font-medium hover:bg-muted transition">
                  Close
                </button>
                <Link href={`/district/${data.id}`}>
                  <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium shadow hover:opacity-90 transition">
                    View Full Details
                  </button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-destructive">Failed to load data.</div>
          )}
        </div>
      </div>
    </div>
  );
}
