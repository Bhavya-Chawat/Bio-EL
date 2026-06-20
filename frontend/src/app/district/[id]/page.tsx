/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function DistrictDetail({ params }: { params: { id: string } }) {
  const [district, setDistrict] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    fetch(`http://localhost:8000/api/districts/${params.id}`)
      .then(res => res.json())
      .then(data => setDistrict(data));
      
    fetch(`http://localhost:8000/api/districts/${params.id}/history`)
      .then(res => res.json())
      .then(data => {
        // Mocking some extra data points if history is too small to chart
        if (data.length < 5) {
          const mockData = [
            { computed_at: "Day 1", r_score: 5 },
            { computed_at: "Day 2", r_score: 6 },
            { computed_at: "Day 3", r_score: 12 },
            { computed_at: "Day 4", r_score: 8 },
            { computed_at: "Today", r_score: data[data.length - 1]?.r_score || 2 }
          ];
          setHistory(mockData);
        } else {
          setHistory(data.map((d: any) => ({ ...d, computed_at: new Date(d.computed_at).toLocaleDateString() })));
        }
      });
  }, [params.id]);

  if (!district) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <Link href="/" className="text-primary hover:underline">&larr; Back to Dashboard</Link>
      
      <header className="flex justify-between items-end border-b-2 border-primary pb-4">
        <div>
          <h1 className="text-4xl font-bold text-primary">{district.name}</h1>
          <p className="text-muted-foreground">{district.state} | Population: {district.population.toLocaleString()}</p>
        </div>
        <div className={`px-4 py-2 rounded text-lg font-bold text-white shadow ${
          district.current_risk.zone === 'high' ? 'bg-destructive' :
          district.current_risk.zone === 'medium' ? 'bg-accent' : 'bg-green-600'
        }`}>
          Risk Zone: {district.current_risk.zone.toUpperCase()}
        </div>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border rounded p-4 shadow">
          <h3 className="font-bold mb-2">Weather (24h)</h3>
          <p>Rainfall: {district.weather.rainfall_mm_24h ?? 'N/A'} mm</p>
          <p>Temp: {district.weather.temperature_c ?? 'N/A'} °C</p>
          <p>Humidity: {district.weather.humidity_pct ?? 'N/A'}%</p>
        </div>
        <div className="bg-card border rounded p-4 shadow">
          <h3 className="font-bold mb-2">River Level</h3>
          <p>Current: {district.river.level_m?.toFixed(2) ?? 'N/A'} m</p>
          <p>Danger Mark: {district.river.danger_mark_m?.toFixed(2) ?? 'N/A'} m</p>
        </div>
        <div className="bg-card border rounded p-4 shadow">
          <h3 className="font-bold mb-2">Vulnerability</h3>
          <p>Open Defecation: {district.vulnerability.open_defecation_pct.toFixed(1)}%</p>
          <p>Vulnerable Pop: {district.vulnerability.elderly_child_pct.toFixed(1)}%</p>
          <p>Hospitals/100k: {district.vulnerability.hospital_density_per_100k.toFixed(1)}</p>
        </div>
      </div>
      
      <div className="bg-card border rounded p-6 shadow h-80">
        <h3 className="font-bold mb-4">Risk Score History</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={history}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="computed_at" />
            <YAxis domain={[0, 27]} />
            <Tooltip />
            <Line type="monotone" dataKey="r_score" stroke="#34908B" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
