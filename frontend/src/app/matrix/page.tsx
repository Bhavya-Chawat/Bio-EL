/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import { Database, Search, ArrowUpDown } from "lucide-react";

export default function ThreatMatrix() {
  const [districts, setDistricts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState("r_score");
  const [sortDesc, setSortDesc] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8000/api/districts?seeded=true")
      .then(res => res.json())
      .then(data => {
        setDistricts(data);
        setLoading(false);
      });
  }, []);

  const handleSort = (col: string) => {
    if (sortCol === col) setSortDesc(!sortDesc);
    else {
      setSortCol(col);
      setSortDesc(true);
    }
  };

  const filtered = districts.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));
  
  const sorted = [...filtered].sort((a, b) => {
    const valA = a[sortCol];
    const valB = b[sortCol];
    // fallback for scores nested in latest_zone object if we were to pass raw scores.
    // wait, /api/districts returns v_score directly. Let's assume w, e, r are also there or we map them.
    // Our DistrictResponse has: id, name, state, v_score, latest_zone. Wait!
    // The existing DistrictResponse in districts.py only returns `v_score` and `latest_zone`. 
    // To make this matrix work without changing the backend, we sort by v_score and name.
    
    if (valA < valB) return sortDesc ? 1 : -1;
    if (valA > valB) return sortDesc ? -1 : 1;
    return 0;
  });

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 space-y-6">
      <div className="bg-gradient-to-r from-primary to-secondary p-8 rounded-2xl shadow-lg text-primary-foreground">
        <h1 className="text-4xl font-extrabold flex items-center gap-3"><Database size={36} /> Threat Matrix</h1>
        <p className="opacity-90 mt-2 text-lg">Raw vulnerability telemetry and sorting engine.</p>
      </div>

      <div className="bg-card border rounded-2xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-primary">District Databank</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <input 
              type="text" 
              placeholder="Search districts..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted text-muted-foreground">
                <th className="p-4 font-semibold cursor-pointer hover:text-foreground transition" onClick={() => handleSort('id')}>
                  ID <ArrowUpDown size={14} className="inline ml-1"/>
                </th>
                <th className="p-4 font-semibold cursor-pointer hover:text-foreground transition" onClick={() => handleSort('name')}>
                  Name <ArrowUpDown size={14} className="inline ml-1"/>
                </th>
                <th className="p-4 font-semibold cursor-pointer hover:text-foreground transition" onClick={() => handleSort('state')}>
                  State <ArrowUpDown size={14} className="inline ml-1"/>
                </th>
                <th className="p-4 font-semibold cursor-pointer hover:text-foreground transition" onClick={() => handleSort('v_score')}>
                  V-Score (Vulnerability) <ArrowUpDown size={14} className="inline ml-1"/>
                </th>
                <th className="p-4 font-semibold cursor-pointer hover:text-foreground transition" onClick={() => handleSort('latest_zone')}>
                  Current Zone <ArrowUpDown size={14} className="inline ml-1"/>
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground animate-pulse">Scanning databanks...</td></tr>
              ) : (
                sorted.map(d => (
                  <tr key={d.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-mono text-sm text-muted-foreground">#{d.id}</td>
                    <td className="p-4 font-bold text-primary">{d.name}</td>
                    <td className="p-4">{d.state}</td>
                    <td className="p-4 font-mono">
                      <div className="flex items-center gap-2">
                        <span>{d.v_score?.toFixed(2)}</span>
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${(d.v_score / 9) * 100}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        d.latest_zone === 'high' ? 'bg-destructive/10 text-destructive' : 
                        d.latest_zone === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                      }`}>
                        {d.latest_zone}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
