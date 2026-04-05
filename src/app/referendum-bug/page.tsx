"use client";
import { useState, useEffect } from "react";
import { useElectionData } from "../../hooks/useElectionData";

const SSTV_GOLD = "#84754D";
const TOTAL_ELIGIBLE_VOTERS = 294876; // Updated to your provided figure

function RollingNumber({ value, decimals = 0 }: { value: string | number | undefined, decimals?: number }) {
  const [displayValue, setDisplayValue] = useState(0);
  const target = parseFloat(value?.toString() || "0");

  useEffect(() => {
    let start = displayValue;
    const duration = 1500; 
    const startTime = performance.now();
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4); 
      const current = start + (target - start) * ease;
      setDisplayValue(current);
      if (progress < 1) requestAnimationFrame(animate);
      else setDisplayValue(target);
    };
    requestAnimationFrame(animate);
  }, [target]);

  return <span>{decimals === 0 ? Math.round(displayValue).toLocaleString() : displayValue.toFixed(decimals)}</span>;
}

export default function ReferendumBug() {
  const { referendum } = useElectionData();

  const data = referendum || {
    yes: 0,
    no: 0,
    boxesReported: 0,
    totalBoxes: 588,
    turnout: "0.00"
  };

  const totalVotes = (Number(data.yes) || 0) + (Number(data.no) || 0);
  const yesPct = totalVotes > 0 ? (data.yes / totalVotes) * 100 : 0;
  const noPct = totalVotes > 0 ? (data.no / totalVotes) * 100 : 0;

  // DYNAMIC TURNOUT CALCULATION
  const dynamicTurnout = TOTAL_ELIGIBLE_VOTERS > 0 
    ? (totalVotes / TOTAL_ELIGIBLE_VOTERS) * 100 
    : 0;

  return (
    <div className="h-screen w-screen bg-transparent p-12 relative overflow-hidden font-sans select-none">
      
      {/* POSITIONED TOP-RIGHT */}
      <div className="absolute top-12 right-12 w-[380px] shadow-[0_30px_60px_rgba(0,0,0,0.9)] border-b-4 border-[#84754D] animate-fade-in overflow-hidden bg-black">
        
        <div className="absolute inset-0 pointer-events-none z-50 opacity-[0.03] scanline-pattern" />

        {/* 1. HEADER */}
        <div className="bg-[#84754D] text-white px-5 py-2 flex justify-between items-center shadow-lg relative z-10">
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse shadow-[0_0_8px_#fff]" />
                <span className="text-[12px] font-black uppercase tracking-[0.2em] italic leading-none">National Referendum</span>
            </div>
            <div className="flex items-center gap-1">
                <span className="text-[9px] font-bold opacity-60 uppercase tracking-tighter">Live Data</span>
            </div>
        </div>

        {/* 2. MAIN DATA BODY */}
        <div className="bg-[#0a0a0a] p-6 border-x-2 border-zinc-900 relative overflow-hidden">
            
            <div className="absolute inset-0 w-full h-full animate-shine z-0 pointer-events-none opacity-10" 
                 style={{ background: 'linear-gradient(90deg, transparent, white, transparent)' }} />

            {/* A. LABELS */}
            <div className="flex justify-between items-end relative z-10 mb-2">
                <span className="text-emerald-500 font-black text-4xl uppercase tracking-widest leading-none drop-shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                    YES
                </span>
                <span className="text-red-600 font-black text-4xl uppercase tracking-widest leading-none drop-shadow-[0_0_10px_rgba(220,38,38,0.3)] text-right">
                    NO
                </span>
            </div>

            {/* B. BATTLE BAR */}
            <div className="relative h-5 w-full bg-zinc-900 rounded-sm overflow-hidden border border-white/5 shadow-inner mb-6 z-10">
                <div 
                    className="absolute left-0 top-0 h-full bg-emerald-500 transition-all duration-1000 ease-out shadow-[4px_0_10px_rgba(0,0,0,0.5)]" 
                    style={{ width: `${yesPct}%` }} 
                />
                <div 
                    className="absolute right-0 top-0 h-full bg-red-600 transition-all duration-1000 ease-out shadow-[-4px_0_10px_rgba(0,0,0,0.5)]" 
                    style={{ width: `${noPct}%` }} 
                />
                <div className="absolute left-1/2 top-0 w-[2px] h-full bg-white/20 z-10" />
            </div>

            {/* C. PERCENTAGES & VOTES */}
            <div className="flex justify-between items-start relative z-10">
                {/* YES DATA */}
                <div className="flex flex-col items-start min-w-0">
                    <div className="text-white text-5xl font-black italic tracking-tighter tabular-nums leading-none">
                        <RollingNumber value={yesPct} decimals={1} /><span className="text-xl ml-0.5 opacity-30">%</span>
                    </div>
                    <div className="mt-2 flex flex-col">
                        <span className="text-zinc-600 text-[10px] font-black uppercase tracking-widest mb-0.5 whitespace-nowrap">Total Votes</span>
                        <span className="text-zinc-400 text-xl font-bold tabular-nums leading-none">
                            <RollingNumber value={data.yes} />
                        </span>
                    </div>
                </div>

                {/* NO DATA */}
                <div className="flex flex-col items-end text-right min-w-0">
                    <div className="text-white text-5xl font-black italic tracking-tighter tabular-nums leading-none">
                        <RollingNumber value={noPct} decimals={1} /><span className="text-xl ml-0.5 opacity-30">%</span>
                    </div>
                    <div className="mt-2 flex flex-col items-end">
                        <span className="text-zinc-600 text-[10px] font-black uppercase tracking-widest mb-0.5 whitespace-nowrap">Total Votes</span>
                        <span className="text-zinc-400 text-xl font-bold tabular-nums leading-none">
                            <RollingNumber value={data.no} />
                        </span>
                    </div>
                </div>
            </div>
        </div>

        {/* 3. FOOTER */}
        <div className="bg-[#050505] p-5 flex justify-between items-center border-x-2 border-zinc-900 border-t border-zinc-800 relative z-10">
            <div className="flex flex-col">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Voter Turnout</span>
                <span className="text-emerald-400 font-black text-3xl italic tracking-tighter leading-none">
                    <RollingNumber value={dynamicTurnout} decimals={2} />%
                </span>
            </div>
            <div className="text-right border-l border-zinc-800 pl-5">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none mb-1">Boxes Reported</span>
                <span className="text-white font-black text-[28px] italic tracking-tighter leading-none block">
                    {data.boxesReported} <span className="text-[#84754D] not-italic text-[16px]">/ {data.totalBoxes}</span>
                </span>
            </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shine {
          0% { transform: translateX(-200%) skewX(-30deg); }
          20% { transform: translateX(300%) skewX(-30deg); }
          100% { transform: translateX(300%) skewX(-30deg); }
        }
        .animate-fade-in { animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-shine { animation: shine 10s infinite ease-in-out; }
        .scanline-pattern {
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.2) 50%);
          background-size: 100% 4px;
        }
      `}</style>
    </div>
  );
}