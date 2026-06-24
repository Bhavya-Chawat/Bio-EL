/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import { Bell, Activity, ArrowRight, ShieldAlert, CheckCircle, Mail, Smartphone } from "lucide-react";

export default function AlertsHub() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [districts, setDistricts] = useState<any[]>([]);
  const [selectedDistrictId, setSelectedDistrictId] = useState<number>(1);
  const [status, setStatus] = useState("");
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch recent dispatches
    fetch("http://localhost:8000/api/alerts/recent")
      .then(res => res.json())
      .then(data => {
        setAlerts(data);
        setLoading(false);
      });

    // Fetch active districts list
    fetch("http://localhost:8000/api/districts?seeded=true")
      .then(res => res.json())
      .then(data => {
        setDistricts(data);
        if (data.length > 0) {
          setSelectedDistrictId(data[0].id);
        }
      })
      .catch(err => console.error("Error loading active districts:", err));
  }, []);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("Subscribing...");
    
    const res = await fetch("http://localhost:8000/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        phone,
        district_ids: [selectedDistrictId], // Use selected district ID from dropdown
        threshold: "medium",
        channels: ["email", "sms"],
        language: "en"
      })
    });
    
    if (res.ok) {
      setStatus("Successfully subscribed!");
      // Reset form
      setEmail("");
      setPhone("");
    } else {
      setStatus("Subscription failed.");
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 space-y-6">
      
      <div className="bg-gradient-to-r from-primary to-secondary p-8 rounded-2xl shadow-lg text-primary-foreground flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-extrabold flex items-center gap-3"><Bell size={36} /> Alerts Command Center</h1>
          <p className="opacity-90 mt-2 text-lg">Monitor dispatched emergency warnings and configure personal alerts.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Alerts Table */}
        <div className="lg:col-span-2 bg-card border rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-primary border-b pb-2">
            <Activity size={24} /> Recent Dispatches
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-muted/50 text-muted-foreground text-sm">
                  <th className="p-3 font-semibold">Time</th>
                  <th className="p-3 font-semibold">Location</th>
                  <th className="p-3 font-semibold">Channel</th>
                  <th className="p-3 font-semibold">Message Preview</th>
                  <th className="p-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {loading ? (
                  <tr><td colSpan={5} className="p-4 text-center">Loading alerts...</td></tr>
                ) : alerts.length === 0 ? (
                  <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">No recent alerts dispatched.</td></tr>
                ) : (
                  alerts.map((alert: any) => (
                    <tr key={alert.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-medium">{new Date(alert.dispatched_at).toLocaleTimeString()}</td>
                      <td className="p-3">
                        <span className="font-bold text-primary">{alert.district_name}</span>
                        <div className="text-xs text-muted-foreground">{alert.state}</div>
                      </td>
                      <td className="p-3 flex items-center gap-2">
                        {alert.channel === 'email' ? <Mail size={16} className="text-blue-500" /> : <Smartphone size={16} className="text-green-500" />}
                        <span className="capitalize">{alert.channel}</span>
                      </td>
                      <td className="p-3">
                        <span className="truncate block max-w-[200px] bg-destructive/10 text-destructive px-2 py-1 rounded text-xs">
                          {alert.message.substring(0, 40)}...
                        </span>
                      </td>
                      <td className="p-3">
                        {alert.status === 'sent' ? (
                          <span className="flex items-center gap-1 text-green-600 font-bold"><CheckCircle size={14}/> Sent</span>
                        ) : (
                          <span className="text-yellow-600 font-bold">Pending</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Quick Subscribe */}
        <div className="lg:col-span-1 bg-card border rounded-2xl shadow-lg p-6 flex flex-col h-fit">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-primary border-b pb-2">
            <ShieldAlert size={20} /> Quick Subscribe
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            Register to receive automated Email and SMS warnings when districts cross the &apos;Medium&apos; or &apos;High&apos; risk threshold.
          </p>
          
          <form onSubmit={handleSubscribe} className="space-y-4 flex-1">
            <div>
              <label className="block text-sm font-semibold mb-1">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full border rounded-lg px-4 py-2 bg-background focus:ring-2 focus:ring-primary outline-none transition" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Phone Number (For SMS)</label>
              <input 
                type="tel" 
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+918951167950"
                className="w-full border rounded-lg px-4 py-2 bg-background focus:ring-2 focus:ring-primary outline-none transition" 
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Select District to Monitor</label>
              <select 
                value={selectedDistrictId}
                onChange={e => setSelectedDistrictId(Number(e.target.value))}
                className="w-full border rounded-lg px-4 py-2 bg-background focus:ring-2 focus:ring-primary outline-none transition cursor-pointer"
                required
              >
                {districts.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.state})
                  </option>
                ))}
              </select>
            </div>
            <button type="submit" className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-lg shadow-md hover:bg-primary/90 transition-all flex justify-center items-center gap-2 group">
              Subscribe <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
          {status && <div className="mt-4 p-3 bg-secondary/20 text-secondary-foreground font-bold rounded-lg text-center">{status}</div>}
        </div>

      </div>
    </div>
  );
}
