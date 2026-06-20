import Link from "next/link";
import { ShieldAlert, Activity, Settings2, Database, Archive, Info } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="bg-primary text-primary-foreground shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <ShieldAlert size={28} className="text-secondary" />
            <span className="font-extrabold text-xl tracking-tight">BioShield</span>
          </div>
          <div className="flex space-x-6">
            <Link href="/" className="flex items-center gap-2 hover:text-secondary transition-colors font-semibold">
              <Activity size={18} /> Dashboard
            </Link>
            <Link href="/matrix" className="flex items-center gap-2 hover:text-secondary transition-colors font-semibold">
              <Database size={18} /> Threat Matrix
            </Link>
            <Link href="/sandbox" className="flex items-center gap-2 hover:text-secondary transition-colors font-semibold">
              <Archive size={18} /> Sandbox
            </Link>
            <Link href="/subscribe" className="flex items-center gap-2 hover:text-secondary transition-colors font-semibold">
              <Settings2 size={18} /> Alerts
            </Link>
            <Link href="/about" className="flex items-center gap-2 hover:text-secondary transition-colors font-semibold">
              <Info size={18} /> How It Works
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
