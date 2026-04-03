"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "sstv@2026") {
      localStorage.setItem("admin_auth", "true");
      router.push("/admin");
    } else {
      setError(true);
      setPassword("");
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center font-mono">
      <div className="w-full max-w-md p-8 border-2 border-zinc-800 bg-[#0a0a0a] shadow-[0_0_50px_rgba(204,0,0,0.1)]">
        <div className="text-center mb-8">
          <div className="bg-[#CC0000] inline-block px-4 py-1 text-white font-black italic text-2xl mb-4">SSTV</div>
          <h1 className="text-zinc-500 uppercase tracking-[0.3em] text-xs font-black">Secure Data Terminal</h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-zinc-600 uppercase mb-2">Access Key</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(false); }}
              autoFocus
              className={`w-full bg-black border-2 ${error ? 'border-rose-600' : 'border-zinc-800'} p-4 text-white font-black text-2xl outline-none focus:border-[#CC0000] transition-all text-center tracking-widest`}
              placeholder="••••••••"
            />
            {error && <p className="text-rose-600 text-[10px] font-black uppercase mt-2 text-center animate-pulse">Access Denied: Invalid Key</p>}
          </div>

          <button 
            type="submit" 
            className="w-full bg-[#CC0000] hover:bg-white hover:text-[#CC0000] text-white font-black py-4 uppercase italic tracking-tighter transition-all border-b-4 border-[#880000] active:border-0"
          >
            Authorize Entry
          </button>
        </form>
        
        <p className="text-center text-[9px] text-zinc-800 mt-8 uppercase font-bold tracking-widest">Authorized Personnel Only</p>
      </div>
    </div>
  );
}