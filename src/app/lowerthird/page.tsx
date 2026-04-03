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

function RollingNumber({
  value,
  decimals = 0,
}: {
  value: string | number | undefined | null;
  decimals?: number;
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const target =
    value !== undefined && value !== null ? parseFloat(value.toString()) : 0;

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

  return (
    <span>
      {decimals === 0
        ? Math.round(displayValue).toLocaleString()
        : displayValue.toFixed(decimals)}
    </span>
  );
}

export default function LowerThirdTV() {
  const { getCityResults } = useElectionData();
  const [index, setIndex] = useState(0);
  const cities = ["Male", "Addu", "Fuvahmulah", "Kulhudhuffushi", "Thinadhoo"];

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % cities.length);
    }, 12000);
    return () => clearInterval(timer);
  }, []);

  const city = cities[index];
  const isMale = city === "Male";
  const { all } = getCityResults(city);

  if (!all || !Array.isArray(all) || all.length === 0) return null;

  const displayList = all.filter((can) => can && can.name).slice(0, 5);

  const totalCityVotes = displayList.reduce(
    (sum, c) => sum + (Number(c.votes) || 0),
    0
  );

  const boxesReported = displayList.reduce(
    (max, c) => Math.max(max, c.boxesReported || 0),
    0
  );
  const totalBoxes =
    displayList.find((c) => c.totalBoxes)?.totalBoxes || (isMale ? 1367 : 100);
  const boxProgress = totalBoxes > 0 ? (boxesReported / totalBoxes) * 100 : 0;

  return (
    <div className="h-screen w-full bg-transparent relative overflow-hidden font-sans select-none">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes progressGrow { from { width: 0%; } to { width: var(--target-width); } }
        .animate-progress { animation: progressGrow 1.5s cubic-bezier(0.1, 0.5, 0.2, 1) forwards; }
        .fade-in { animation: fadeIn 0.6s ease-out forwards; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        
        /* TV Shine Animation */
        @keyframes shine {
          0% { transform: translateX(-150%) skewX(-20deg); }
          20% { transform: translateX(250%) skewX(-20deg); }
          100% { transform: translateX(250%) skewX(-20deg); }
        }
        .animate-shine { animation: shine 8s infinite ease-in-out; }

        /* Subtle Scanline Texture */
        .scanline-overlay {
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%);
          background-size: 100% 4px;
          z-index: 5;
        }
      `,
        }}
      />

      <div 
        className="absolute bottom-[10%] flex items-end h-[105px] gap-0 overflow-visible" 
        style={{ right: '207px', width: '1398px' }}
      >
        
        {/* CITY & BOX TAG */}
        <div
          className="flex flex-col justify-end h-full fade-in shrink-0"
          key={`city-tag-${city}`}
        >
          <div className="bg-white border-l-[10px] border-[#84754D] px-4 py-2 shadow-2xl min-w-[210px] h-full flex flex-col justify-center relative overflow-hidden">
            <p className="text-[8px] font-black text-zinc-400 uppercase tracking-[0.3em] leading-none mb-1">
              MAYOR RACE
            </p>
            <h1 className="text-[#84754D] text-2xl font-black italic uppercase tracking-tighter leading-none mb-1">
              {city}
            </h1>

            <div className="flex justify-between items-end mb-1">
              <span className="text-[10px] font-black text-zinc-800 italic">
                {boxesReported}{" "}
                <span className="text-zinc-400 not-italic">/ {totalBoxes}</span>
              </span>
              <span className="text-[7px] font-bold text-zinc-400 uppercase tracking-tighter">
                Boxes
              </span>
            </div>

            <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden border border-zinc-200">
              <div
                className="bg-[#84754D] h-full transition-all duration-1000 ease-out"
                style={{ width: `${boxProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* CANDIDATES GRID */}
        <div className="flex-1 flex h-full items-end gap-1 ml-1">
          {displayList.map((can, i) => {
            const partyColor = PARTY_COLORS[can.party] || "#71717a";
            const safeName = can.name || "Unknown";
            const imageName = safeName.toLowerCase().replace(/ /g, "_");
            const displayName = safeName;

            const currentVotes = Number(can.votes) || 0;
            const calcPct = totalCityVotes > 0 ? (currentVotes / totalCityVotes) * 100 : 0;

            return (
              <div
                key={`${city}-${safeName}-${i}`}
                className="flex-1 min-w-0 h-full relative fade-in flex bg-zinc-900 border-b-[6px] shadow-2xl overflow-visible"
                style={{
                  animationDelay: `${i * 0.05}s`,
                  borderBottomColor: partyColor,
                }}
              >
                {/* PROGRESS BAR */}
                <div
                  key={`bar-${city}-${safeName}`}
                  className="absolute top-0 left-0 h-full animate-progress z-0 opacity-100"
                  style={{
                    backgroundColor: partyColor,
                    // @ts-ignore
                    "--target-width": `${calcPct}%`,
                  }}
                />

                {/* VISUAL POLISH LAYERS */}
                <div className="absolute inset-0 scanline-overlay pointer-events-none opacity-20" />
                <div className="absolute inset-0 animate-shine z-[6] pointer-events-none opacity-10" 
                     style={{ background: 'linear-gradient(90deg, transparent, white, transparent)' }} />

                <div className="relative z-10 flex w-full h-full overflow-visible">
                  {/* PHOTO AREA */}
                  <div className={`h-full flex items-end shrink-0 z-40 relative ml-1 w-[40%]`}>
                    <img
                      src={`/candidates/${imageName}.png`}
                      className="h-[135%] w-auto object-contain object-bottom drop-shadow-2xl scale-105 origin-bottom"
                      alt={safeName}
                    />
                  </div>

                  {/* DATA AREA */}
                  <div className={`flex flex-col justify-between p-2 flex-1 min-w-0 text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] text-right z-30`}>
                    
                    <div className={isMale ? "absolute top-2 left-[-20px] text-left" : ""}>
                      <p className="text-[7px] font-black uppercase tracking-widest opacity-80 leading-none mb-0.5">
                        {can.party || "IND"}
                      </p>
                      <h2 className={`font-black italic uppercase tracking-tighter drop-shadow-2xl 
                        ${isMale 
                          ? 'text-[19px] leading-[0.8] whitespace-normal break-words max-w-[140px]' 
                          : 'text-[17px] leading-tight whitespace-nowrap truncate'
                        }`}>
                        {displayName}
                      </h2>
                    </div>

                    <div className="flex flex-col items-end mt-auto mb-1">
                      <p className="font-black tabular-nums leading-none tracking-tighter text-[17px]">
                        <RollingNumber value={currentVotes} />
                      </p>
                      <p className="text-[6px] font-bold uppercase tracking-widest leading-none mt-0.5 opacity-70">
                        VOTES
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-black italic tracking-tighter tabular-nums leading-none drop-shadow-xl text-[26px]">
                        <RollingNumber value={calcPct} decimals={1} />
                        <span className="text-sm ml-0.5 opacity-60">%</span>
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