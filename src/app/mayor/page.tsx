"use client";
import { useElectionData } from "../../hooks/useElectionData";

const PARTY_COLORS: Record<string, string> = {
  "Congress Party": "#21AC9B",
  "MDP": "#FAB100",
  "MDA": "#F67D1F",
  "IND": "#71717a" 
};

export default function MayorTV() {
  // Use our new reusable hook
  const { getCityResults, connected } = useElectionData();
  
  const cities = ["Male", "Addu", "Fuvahmulah", "Kulhudhuffushi", "Thinadhoo"];

  return (
    <div className="h-screen w-full bg-transparent p-10 font-sans select-none overflow-hidden relative">
      
      <div className="w-[460px] shadow-2xl bg-white rounded-lg border border-zinc-300 overflow-hidden">
        
        {/* HEADER */}
        <div className="bg-[#0047AB] text-white py-2.5 px-5 border-b-2 border-white relative">
          <h1 className="text-2xl font-black uppercase tracking-tighter italic">CITY MAYOR RESULTS</h1>
          {/* Status Dot */}
        </div>

        <div>
          {cities.map((city) => {
            // Get pre-calculated results from the hook
            const { top2 } = getCityResults(city);

            if (top2.length === 0) return null;

            return (
              <div key={city} className="border-b last:border-b-0 border-zinc-200">
                <div className="flex justify-between items-center px-4 py-0.5 bg-zinc-100 border-b border-zinc-200 uppercase italic font-black text-[13px] text-zinc-600">
                  <span>{city} City</span>
                  <div className="flex gap-12 text-[9px] font-bold text-zinc-400 mr-8">
                    <span>VOTES</span>
                    <span>%</span>
                  </div>
                </div>

                {top2.map((can, i) => {
                  const partyColor = PARTY_COLORS[can.party] || "#71717a";
                  
                  return (
                    <div key={i} className="flex h-[70px] items-center relative border-b last:border-b-0 border-zinc-100">
                      
                      <div className="w-[70px] h-full bg-zinc-200 border-r border-white overflow-hidden relative shrink-0">
                        <img 
                          src={`/candidates/${can.name.toLowerCase().replace(/ /g, '_')}.png`} 
                          className="w-full h-full object-cover" 
                          onError={(e) => { e.currentTarget.src = "/candidates/placeholder.jpg"; }} 
                        />
                        <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: partyColor }} />
                      </div>

                      <div 
                        className="flex-1 px-3 h-full flex flex-col justify-center" 
                        style={{ backgroundColor: i === 0 ? `${partyColor}20` : 'transparent' }}
                      >
                        {i === 0 && (
                          <div className="flex items-center gap-1 text-[8px] font-black uppercase mb-0" style={{ color: partyColor }}>
                            <span className="rounded-full w-3 h-3 flex items-center justify-center text-[7px] text-white" style={{ backgroundColor: partyColor }}>✓</span> 
                            LEADING
                          </div>
                        )}
                        <p className="font-black text-[16px] text-zinc-900 uppercase leading-none tracking-tight">
                          {can.name}
                        </p>
                      </div>

                      <div className="w-[50px] h-full border-l border-white shrink-0 bg-white">
                        <img 
                          src={`/logos/${can.party.toLowerCase().replace(/ /g, '')}.png`} 
                          className="w-full h-full object-cover" 
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                      </div>

                      <div className="w-[90px] h-full bg-zinc-700 flex items-center justify-center border-l border-white shrink-0 text-white font-black text-lg tabular-nums">
                        {can.votes?.toLocaleString()}
                      </div>

                      <div 
                        className="w-[75px] h-full flex items-center justify-center shrink-0 text-white font-black text-base italic tabular-nums" 
                        style={{ backgroundColor: partyColor }}
                      >
                        {can.percentage}%
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}