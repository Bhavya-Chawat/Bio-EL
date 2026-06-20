"use client";
import { Info, Cpu, Droplets, Bug, AlertTriangle, ShieldCheck } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8 space-y-8">
      
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary p-8 rounded-2xl shadow-lg text-primary-foreground flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-extrabold flex items-center gap-3"><Info size={36} /> How It Works</h1>
          <p className="opacity-90 mt-2 text-lg">Understanding the BioShield Prediction Engine & Architecture</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Core Algorithm */}
        <div className="bg-card border rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold flex items-center gap-2 border-b pb-4 mb-6">
            <Cpu className="text-primary" /> The Prediction Engine (R-Score)
          </h2>
          <p className="text-muted-foreground mb-6">
            The BioShield Early-Warning System uses a mathematically weighted multi-factorial algorithm to calculate a real-time Risk Score (R-Score) for every district. The formula continuously ingests live telemetry and historical statistics:
          </p>
          <div className="bg-muted p-4 rounded-xl font-mono text-center text-lg mb-6 border border-border">
            R-Score = (W * 0.4) + (E * 0.4) + (V * 0.2)
          </div>
          
          <ul className="space-y-4">
            <li className="flex items-start gap-3">
              <Droplets className="text-blue-500 mt-1 shrink-0" />
              <div>
                <strong className="text-foreground">W-Score (Weather / Rainfall) [40%]:</strong>
                <p className="text-sm text-muted-foreground">Calculated using 24-hour rainfall data from Open-Meteo. Spikes if rainfall approaches 90th percentile historical anomalies.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <AlertTriangle className="text-destructive mt-1 shrink-0" />
              <div>
                <strong className="text-foreground">E-Score (Elevation / River Stage) [40%]:</strong>
                <p className="text-sm text-muted-foreground">Monitors actual river water levels against established Central Water Commission (CWC) Danger Marks.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <ShieldCheck className="text-green-600 mt-1 shrink-0" />
              <div>
                <strong className="text-foreground">V-Score (Vulnerability) [20%]:</strong>
                <p className="text-sm text-muted-foreground">A static multiplier based on local infrastructure: Open defecation rates, hospital density, and historical flood frequency.</p>
              </div>
            </li>
          </ul>
        </div>

        {/* Biosafety Integration */}
        <div className="bg-card border rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold flex items-center gap-2 border-b pb-4 mb-6">
            <Bug className="text-primary" /> Epidemiological Threat Matrix
          </h2>
          <p className="text-muted-foreground mb-6">
            As a dedicated Biosafety Project, BioShield does not just predict floods—it predicts the subsequent biological fallout. Flooding is the primary catalyst for waterborne and vector-borne disease outbreaks.
          </p>
          
          <div className="space-y-6">
            <div className="border-l-4 border-destructive pl-4 py-2">
              <h3 className="font-bold text-destructive">CRITICAL ZONE (Waterborne Pathogens)</h3>
              <p className="text-sm text-muted-foreground mt-1">When rivers overflow, sewage mixes with drinking water. BioShield triggers Cat-4 alerts for <strong>Vibrio cholerae</strong> and Typhoid. Automated alerts instruct relief workers to adopt <strong>BSL-2 precautions</strong> and initiate Doxycycline prophylaxis.</p>
            </div>
            
            <div className="border-l-4 border-yellow-500 pl-4 py-2">
              <h3 className="font-bold text-yellow-600">ELEVATED ZONE (Zoonotic Pathogens)</h3>
              <p className="text-sm text-muted-foreground mt-1">Stagnant floodwaters heavily increase the risk of <strong>Leptospirosis</strong> (spread via animal urine). BioShield elevates the Contamination Risk Index and advises standard PPE.</p>
            </div>
            
            <div className="border-l-4 border-primary pl-4 py-2">
              <h3 className="font-bold text-primary">BASELINE ZONE (Vector-borne)</h3>
              <p className="text-sm text-muted-foreground mt-1">Routine monitoring for Malaria and Dengue fever, which thrive in post-flood residual pools.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
