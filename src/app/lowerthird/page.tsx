"use client";
import { useState, useEffect } from "react";
import { useElectionData } from "../../hooks/useElectionData";

const PARTY_COLORS: Record<string, string> = {
  "PNC": "#21AC9B",
  "MDP": "#FAB100",
  "MDA": "#F67D1F",
  "IND": "#71717a",
};

function RollingNumber({ value, decimals = 0 }: { value: string | number | undefined | null; decimals?: number; }) {
  const [displayValue, setDisplayValue] = useState(0);
  const target = value !== undefined && value !== null ? parseFloat(value.toString()) : 0;
  useEffect(() => {
    let start = displayValue;
    const duration = 1000;
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
  return (<span>{decimals === 0 ? Math.round(displayValue).toLocaleString() : displayValue.toFixed(decimals)}</span>);
}

export default function LowerThirdTV() {
  const { getCityResults } = useElectionData();
  const [index, setIndex] = useState(0);
  const cities = ["Male", "Addu", "Fuvahmulah", "Kulhudhuffushi", "Thinadhoo"];

  useEffect(() => {
    const timer = setInterval(() => { setIndex((prev) => (prev + 1) % cities.length); }, 12000);
    return () => clearInterval(timer);
  }, []);

  const city = cities[index];
  const isMale = city === "Male";
  const { all } = getCityResults(city);

  if (!all || !Array.isArray(all) || all.length === 0) return null;

  const displayList = all.filter((can) => can && can.name).slice(0, 5);
  const totalCityVotes = displayList.reduce((sum, c) => sum + (Number(c.votes) || 0), 0);
  const boxesReported = displayList.reduce((max, c) => Math.max(max, c.boxesReported || 0), 0);
  const totalBoxes = displayList.find((c) => c.totalBoxes)?.totalBoxes || 100;
  const boxProgress = totalBoxes > 0 ? (boxesReported / totalBoxes) * 100 : 0;

  return (
    <div className="h-[1080px] w-[1920px] bg-transparent relative overflow-hidden font-sans select-none">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes progressGrow { from { width: 0%; } to { width: var(--target-width); } }
        .animate-progress { animation: progressGrow 1.5s cubic-bezier(0.1, 0.5, 0.2, 1) forwards; }
        @keyframes contentFade { from { opacity: 0; } to { opacity: 1; } }
        .content-fade { animation: contentFade 0.8s ease-in-out forwards; }
        @keyframes shine {
          0% { transform: translateX(-100%) skewX(-20deg); }
          30% { transform: translateX(200%) skewX(-20deg); }
          100% { transform: translateX(200%) skewX(-20deg); }
        }
        .animate-shine { animation: shine 8s infinite ease-in-out; }
        .edge-guard { box-shadow: 0 0 0 2px #000000; outline: 2px solid #000000; }
      `}} />

      <div 
        className="absolute bottom-[10%] left-[80px] flex items-end h-[100px] gap-0 overflow-visible edge-guard bg-black" 
        style={{ width: '1650px' }} 
      >
        <div className="absolute inset-0 bg-black z-0" />

        {/* CITY INFO PANEL */}
        <div className="flex flex-col justify-end h-full shrink-0 z-50 bg-white border-l-[10px] border-[#84754D] w-[230px]">
          <div className="px-4 py-2 h-full flex flex-col justify-center relative overflow-hidden content-fade" key={`city-data-${city}`}>
            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-0.5">MAYOR RACE</p>
            <h1 className="text-[#84754D] text-xl font-black italic uppercase tracking-tighter mb-1 leading-none">{city}</h1>
            <div className="flex justify-between items-end mb-1">
              <span className="text-[12px] font-black text-zinc-800 italic">{boxesReported} <span className="text-zinc-400 not-italic">/ {totalBoxes}</span></span>
              <span className="text-[8px] font-bold text-zinc-400 uppercase">Boxes</span>
            </div>
            <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden border border-zinc-200">
              <div className="bg-[#84754D] h-full transition-all duration-1000 ease-out" style={{ width: `${boxProgress}%` }} />
            </div>
          </div>
        </div>

        {/* CANDIDATE GRID */}
        <div className="flex-1 flex h-full items-end gap-1 ml-1 z-10 bg-black overflow-visible relative">
          {displayList.map((can, i) => {
            const partyColor = PARTY_COLORS[can.party] || "#71717a";
            const safeName = can.name || "Unknown";
            const nameParts = safeName.split(' ');
            const imageName = safeName.toLowerCase().trim().replace(/\s+/g, "_");
            const currentVotes = Number(can.votes) || 0;
            const calcPct = totalCityVotes > 0 ? (currentVotes / totalCityVotes) * 100 : 0;

            return (
              <div
                key={`bar-segment-${city}-${i}`}
                className="flex-1 min-w-0 h-full relative flex bg-zinc-900 border-b-[6px] overflow-visible"
                style={{ borderBottomColor: partyColor, zIndex: 10 - i }}
              >
                {/* PROGRESS BAR - Matches exact Party Color */}
                <div className="absolute top-0 left-0 h-full animate-progress z-0 opacity-40"
                   style={{ backgroundColor: partyColor, "--target-width": `${calcPct}%` } as any} />

                <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
                   <div className="absolute inset-0 animate-shine opacity-10" 
                        style={{ background: 'linear-gradient(90deg, transparent, white, transparent)', width: '100%' }} />
                </div>

                <div className="relative z-10 flex w-full h-full items-center overflow-visible content-fade px-2" key={`candidate-content-${city}-${i}`}>
                  
                  {/* PHOTO - Slightly larger width since we have more room */}
                  <div className={`${isMale ? 'w-[75px]' : 'w-[95px]'} h-full flex items-end shrink-0 z-0 relative overflow-visible mr-2`}>
                    <img
                      src={`/candidates/${imageName}.png?t=${Date.now()}`}
                      className="h-[135%] w-auto object-contain object-bottom drop-shadow-[0_5px_15px_rgba(0,0,0,1)] scale-110 origin-bottom"
                      alt={safeName}
                      onError={(e) => { e.currentTarget.src = "/candidates/default.png"; }}
                    />
                  </div>

                  {/* NAME */}
                  <div className="flex flex-col justify-center z-30 min-w-0 pr-1 flex-1">
                    <h2 className={`text-white font-black italic uppercase tracking-tighter leading-[0.8] ${isMale ? 'text-[20px]' : 'text-[22px] whitespace-nowrap truncate'}`}>
                      {isMale && nameParts.length > 1 ? (
                        <>
                          <span>{nameParts[0]}</span> <br/>
                          <span className="text-[18px] opacity-75 font-bold leading-none">
                            {nameParts.slice(1).join(' ')}
                          </span>
                        </>
                      ) : (
                        <span>{safeName}</span>
                      )}
                    </h2>
                    <p className={`${isMale ? 'text-[9px]' : 'text-[11px]'} font-black uppercase text-white/50 mt-1`}>
                        {can.party}
                    </p>
                  </div>

                  {/* DATA BLOCK */}
                  <div className="flex flex-col justify-center items-end z-30 text-white pr-1 ml-auto shrink-0">
                    <p className={`font-black italic tracking-tighter tabular-nums leading-none text-white 
                      ${isMale ? 'text-[30px]' : 'text-[44px]'}`}>
                        <RollingNumber value={calcPct} decimals={1} />
                        <span className={`${isMale ? 'text-[10px]' : 'text-[14px]'} ml-0.5 opacity-60`}>%</span>
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className={`${isMale ? 'text-[7px]' : 'text-[9px]'} font-bold uppercase opacity-40 tracking-widest`}>VOTES</span>
                      <span className={`font-black tabular-nums leading-none text-white/90 
                        ${isMale ? 'text-[17px]' : 'text-[22px]'}`}>
                        <RollingNumber value={currentVotes} />
                      </span>
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}