"use client";
import { useState, useEffect } from "react";
import { useElectionData } from "../../hooks/useElectionData";

const SSTV_GOLD = "#84754D";
const PARTY_COLORS: Record<string, string> = {
  "Congress Party": "#21AC9B",
  MDP: "#FAB100",
  MDA: "#F67D1F",
  IND: "#71717a",
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
  const totalBoxes = displayList.find((c) => c.totalBoxes)?.totalBoxes || (isMale ? 1367 : 100);
  const boxProgress = totalBoxes > 0 ? (boxesReported / totalBoxes) * 100 : 0;

  return (
    <div className="h-screen w-full bg-transparent relative overflow-hidden font-sans select-none">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes progressGrow { from { width: 0%; } to { width: var(--target-width); } }
        .animate-progress { animation: progressGrow 1.5s cubic-bezier(0.1, 0.5, 0.2, 1) forwards; }
        
        /* Smooth Cross-Fade for data only */
        @keyframes contentFade { from { opacity: 0; } to { opacity: 1; } }
        .content-fade { animation: contentFade 0.8s ease-in-out forwards; }
        
        @keyframes shine {
          0% { transform: translateX(-100%) skewX(-20deg); }
          30% { transform: translateX(200%) skewX(-20deg); }
          100% { transform: translateX(200%) skewX(-20deg); }
        }
        .animate-shine { animation: shine 8s infinite ease-in-out; }
        
        .edge-guard {
          box-shadow: 0 0 0 2px #000000;
          outline: 2px solid #000000;
        }
      `}} />


      <div 
        className="absolute bottom-[12%] flex items-end h-[103px] gap-0 overflow-visible edge-guard bg-black" 
        style={{ right: '120px', width: '1620px' }}
      >
        <div className="absolute inset-0 bg-black z-0" />

        <div className="flex flex-col justify-end h-full shrink-0 z-10 bg-white border-l-[10px] border-[#84754D] min-w-[280px]">
          <div className="px-6 py-2 h-full flex flex-col justify-center relative overflow-hidden content-fade" key={`city-data-${city}`}>
            <p className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em] mb-1">MAYOR RACE</p>
            <h1 className="text-[#84754D] text-3xl font-black italic uppercase tracking-tighter mb-2">{city}</h1>
            <div className="flex justify-between items-end mb-1">
              <span className="text-[12px] font-black text-zinc-800 italic">{boxesReported} <span className="text-zinc-400 not-italic">/ {totalBoxes}</span></span>
              <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-tighter">Boxes Reported</span>
            </div>
            <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden border border-zinc-200">
              <div className="bg-[#84754D] h-full transition-all duration-1000 ease-out" style={{ width: `${boxProgress}%` }} />
            </div>
          </div>
        </div>

        <div className="flex-1 flex h-full items-end gap-1 ml-1 z-10 bg-black overflow-visible relative">
          {displayList.map((can, i) => {
            const partyColor = PARTY_COLORS[can.party] || "#71717a";
            const safeName = can.name || "Unknown";
            const imageName = safeName.toLowerCase().replace(/ /g, "_");
            const currentVotes = Number(can.votes) || 0;
            const calcPct = totalCityVotes > 0 ? (currentVotes / totalCityVotes) * 100 : 0;

            return (
              /* Static Bar Segment */
              <div
                key={`bar-segment-${i}`} 
                className="flex-1 min-w-0 h-full relative flex bg-zinc-900 border-b-[6px] overflow-visible"
                style={{ borderBottomColor: partyColor }}
              >
                {/* Dynamic Progress Fill */}
                <div 
                   className="absolute top-0 left-0 h-full animate-progress z-0"
                   style={{ backgroundColor: partyColor, "--target-width": `${calcPct}%`, filter: 'brightness(0.6)' } as any} 
                />

                {/* Shine Animation (Internal Only) */}
                <div className="absolute inset-0 z-[1] pointer-events-none overflow-hidden">
                   <div className="absolute inset-0 animate-shine opacity-10" 
                        style={{ background: 'linear-gradient(90deg, transparent, white, transparent)', width: '100%' }} />
                </div>

                {/* DYNAMIC CONTENT: Only this part fades/moves on city change */}
                <div className="relative z-10 flex w-full h-full overflow-visible content-fade" key={`candidate-content-${city}-${i}`}>
                  
                  {/* Photo Headroom preserved */}
                  <div className="h-full flex items-end shrink-0 z-40 relative ml-1 w-[38%] overflow-visible">
                    <img
                      src={`/candidates/${imageName}.png`}
                      className="h-[135%] w-auto object-contain object-bottom drop-shadow-[0_5px_15px_rgba(0,0,0,1)] scale-100 origin-bottom"
                      alt={safeName}
                      onError={(e) => { e.currentTarget.src = "/candidates/default.png"; }}
                    />
                  </div>

                  <div className="flex flex-col justify-between p-2 flex-1 min-w-0 text-white drop-shadow-[0_2px_12px_rgba(0,0,0,1)] text-right z-30">
                    <div className={isMale ? "absolute top-2 left-[-15px] text-left" : ""}>
                      <p className="text-[7px] font-black uppercase tracking-widest opacity-90 leading-none mb-0.5">{can.party || "IND"}</p>
                      <h2 className={`font-black italic uppercase tracking-tighter ${isMale ? 'text-[19px] leading-[0.85] max-w-[150px]' : 'text-[17px] truncate'}`}>
                        {safeName}
                      </h2>
                    </div>
                    <div className="flex flex-col items-end mt-auto mb-1">
                      <p className="font-black tabular-nums leading-none tracking-tighter text-[20px]"><RollingNumber value={currentVotes} /></p>
                      <p className="text-[7px] font-bold uppercase tracking-widest leading-none mt-0.5 opacity-80">VOTES</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black italic tracking-tighter tabular-nums leading-none text-[30px]">
                        <RollingNumber value={calcPct} decimals={1} /><span className="text-sm ml-0.5 opacity-75">%</span>
                      </p>
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