"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation"; 
import { io, Socket } from "socket.io-client";

const PARTY_COLORS: Record<string, string> = {
  "Congress Party": "#21AC9B", "MDP": "#FAB100", "MDA": "#F67D1F", "IND": "#71717a",
};

const ELIGIBLE_VOTERS = 294876;
const REFERENDUM_TOTAL_BOXES = 588;

const ELECTION_DATA: Record<string, { totalBoxes: number; candidates: any[] }> = {
  Male: { totalBoxes: 1367, candidates: [{ no: 1, name: "Ahmed Aiham Mohamed", party: "IND" }, { no: 2, name: "Ismail Zariyand", party: "IND" }, { no: 3, name: "Adam Azim", party: "MDP" }, { no: 4, name: "Moosa Ali Jaleel", party: "Congress Party" }, { no: 5, name: "Abdulla Mahzoom Majid", party: "MDA" }] },
  Addu: { totalBoxes: 702, candidates: [{ no: 1, name: "Mohamed Ahsam", party: "IND" }, { no: 2, name: "Mushrif Ali", party: "Congress Party" }, { no: 3, name: "Ali Nizar", party: "MDP" }] },
  Fuvahmulah: { totalBoxes: 453, candidates: [{ no: 1, name: "Ismail Rafeeq", party: "MDP" }, { no: 2, name: "Ali Maseeh", party: "Congress Party" }] },
  Kulhudhuffushi: { totalBoxes: 294, candidates: [{ no: 1, name: "Ibrahim Hassan", party: "Congress Party" }, { no: 2, name: "Mohamed Athif", party: "MDP" }] },
  Thinadhoo: { totalBoxes: 212, candidates: [{ no: 1, name: "Mohamed Ajeeb", party: "Congress Party" }, { no: 2, name: "Saud Ali", party: "MDP" }] },
};

export default function AdminConsole() {
  const socketRef = useRef<Socket | null>(null);
  const router = useRouter();
  
  const [selectedCity, setSelectedCity] = useState("Male");
  const [voteInputs, setVoteInputs] = useState<Record<string, string>>({});
  const [cityBoxes, setCityBoxes] = useState<Record<string, string>>({});
  const [refData, setRefData] = useState({ yes: "", no: "", boxes: "" });
  const [status, setStatus] = useState("OFFLINE");
  const [autoFetch, setAutoFetch] = useState(true); // Default to ON

  useEffect(() => {
    const isAuth = localStorage.getItem("admin_auth");
    if (isAuth !== "true") router.push("/admin/login");
  }, [router]);

  useEffect(() => {
    socketRef.current = io();
    socketRef.current.on("connect", () => {
      setStatus("LIVE");
      socketRef.current?.emit("get-initial-data");
    });

    socketRef.current.on("auto-fetch-status", (enabled: boolean) => {
      setAutoFetch(enabled);
    });

    socketRef.current.on("sync-data", (data: any) => {
        if (!data) return;
        if (data.isAutoFetchEnabled !== undefined) setAutoFetch(data.isAutoFetchEnabled);
        
        const newVotes: Record<string, string> = {};
        const newBoxes: Record<string, string> = {};
        
        Object.keys(ELECTION_DATA).forEach(c => { newBoxes[c] = "0"; });
      
        if (data.mayors && Array.isArray(data.mayors)) {
          data.mayors.forEach((m: any) => {
            if (!m || !m.city) return;
            newVotes[`${m.city}-${m.no}`] = (m.votes ?? 0).toString();
            const currentBoxCount = Number(newBoxes[m.city] || 0);
            const incomingBoxCount = Number(m.boxesReported || 0);
            if (incomingBoxCount >= currentBoxCount) { newBoxes[m.city] = incomingBoxCount.toString(); }
          });
        }
      
        if (data.referendum) {
          setRefData({
            yes: (data.referendum.yes ?? 0).toString(),
            no: (data.referendum.no ?? 0).toString(),
            boxes: (data.referendum.boxesReported ?? 0).toString(),
          });
        }
      
        setVoteInputs(prev => ({ ...newVotes, ...prev }));
        setCityBoxes(prev => ({ ...newBoxes, ...prev }));
      });

    return () => { socketRef.current?.disconnect(); };
  }, []);

  const toggleAutoFetch = () => {
    const newState = !autoFetch;
    setAutoFetch(newState);
    socketRef.current?.emit("toggle-auto-fetch", newState);
  };

  const pushMayor = (can: any) => {
    if (autoFetch) return; // Block manual push
    const val = voteInputs[`${selectedCity}-${can.no}`] || "0";
    const boxes = cityBoxes[selectedCity] || "0";
    
    socketRef.current?.emit("update-results", {
      type: "mayors",
      data: {
        id: `mayor-${selectedCity}-${can.no}`.toLowerCase(),
        city: selectedCity,
        no: can.no,
        name: can.name,
        party: can.party,
        votes: Number(val),
        boxesReported: Number(boxes),
        totalBoxes: ELECTION_DATA[selectedCity].totalBoxes
      }
    });
  };

  const pushRef = () => {
    if (autoFetch) return; // Block manual push
    const total = Number(refData.yes || 0) + Number(refData.no || 0);
    socketRef.current?.emit("update-results", {
      type: "referendum",
      data: {
        id: "national-ref-2026",
        yes: Number(refData.yes || 0),
        no: Number(refData.no || 0),
        boxesReported: Number(refData.boxes || 0),
        totalBoxes: REFERENDUM_TOTAL_BOXES,
        turnout: total > 0 ? ((total / ELIGIBLE_VOTERS) * 100).toFixed(2) : "0.00",
      }
    });
  };

  const current = ELECTION_DATA[selectedCity];
  const totalCityVotes = current.candidates.reduce((sum, can) => sum + Number(voteInputs[`${selectedCity}-${can.no}`] || 0), 0);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-mono p-4">
      {/* PROFESSIONAL HEADER */}
      <header className="flex justify-between items-center bg-[#111] border-2 border-[#CC0000] p-4 mb-6 shadow-[0_10px_30px_rgba(204,0,0,0.2)]">
        <div className="flex items-center gap-10">
          <div className="bg-[#CC0000] px-6 py-2 font-black italic text-4xl tracking-tighter">SSTV</div>
          <div className="space-y-1">
            <h1 className="text-xs font-black uppercase tracking-[0.5em] text-zinc-500">Master Operations Terminal</h1>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${status === "LIVE" ? "bg-emerald-500 animate-pulse" : "bg-red-600"}`} />
                <span className="text-[10px] font-bold uppercase tracking-widest">{status}</span>
              </div>
              
              {/* BYPASS TOGGLE */}
              <button 
                onClick={toggleAutoFetch}
                className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border-2 transition-all ${autoFetch ? 'bg-emerald-600/20 border-emerald-500 text-emerald-500' : 'bg-rose-600/20 border-rose-500 text-rose-500'}`}
              >
                {autoFetch ? "● AUTO-FETCH ACTIVE" : "○ MANUAL BYPASS MODE"}
              </button>
            </div>
          </div>
        </div>
        <div className="flex gap-4">
            <button onClick={() => { if(confirm("WIPE DB?")) socketRef.current?.emit("wipe-all-data"); }} className="px-4 py-2 bg-zinc-900 border border-red-900 text-red-500 text-[10px] font-black uppercase hover:bg-red-600 hover:text-white transition-all">Emergency Wipe</button>
            <button onClick={() => { localStorage.removeItem("admin_auth"); router.push("/admin/login"); }} className="px-4 py-2 bg-zinc-800 text-zinc-400 text-[10px] font-black uppercase hover:bg-white hover:text-black transition-all">Logout</button>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-6">
        {/* CITY NAVIGATION */}
        <div className="col-span-2 space-y-2">
          {Object.keys(ELECTION_DATA).map(city => (
            <button key={city} onClick={() => setSelectedCity(city)} className={`w-full text-left p-4 font-black text-xs border-l-8 transition-all ${selectedCity === city ? "bg-[#CC0000] border-white text-white translate-x-2" : "bg-[#151515] border-transparent text-zinc-600 hover:text-white"}`}>
              {city.toUpperCase()}
            </button>
          ))}
        </div>

        {/* MAYOR CONTROL AREA */}
        <div className="col-span-7 space-y-6">
          <div className="bg-[#111] p-8 border-2 border-zinc-800 flex justify-between items-center shadow-xl relative">
            {autoFetch && <div className="absolute inset-0 bg-black/40 z-10 backdrop-blur-[1px] flex items-center justify-center font-black text-emerald-500 italic text-xs tracking-widest uppercase">External Data Syncing...</div>}
            <div className="space-y-4">
              <span className="text-[10px] font-black text-[#CC0000] uppercase block tracking-widest underline decoration-zinc-700 underline-offset-8 decoration-4">{selectedCity} Box Tracking</span>
              <div className="flex items-center gap-4 pt-2">
                <input disabled={autoFetch} type="number" value={cityBoxes[selectedCity] || ""} onChange={(e) => setCityBoxes({...cityBoxes, [selectedCity]: e.target.value})} className="bg-black border-4 border-zinc-800 text-emerald-400 text-6xl font-black p-4 w-44 outline-none focus:border-emerald-500 tabular-nums shadow-inner disabled:opacity-50" placeholder="0" />
                <span className="text-zinc-800 font-black text-4xl italic">/ {current.totalBoxes}</span>
                <button disabled={autoFetch} onClick={() => pushMayor(current.candidates[0])} className="ml-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black px-10 py-6 text-sm uppercase italic border-b-4 border-emerald-900 active:border-0 transition-all disabled:bg-zinc-800 disabled:border-zinc-900">Push {selectedCity} Boxes</button>
              </div>
            </div>
            <div className="text-right">
                <span className="text-[10px] font-black text-zinc-600 uppercase block mb-2">Total Verified Ballots</span>
                <span className="text-7xl font-black tabular-nums tracking-tighter text-white">{totalCityVotes.toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-2">
            {current.candidates.map(can => {
              const partyColor = PARTY_COLORS[can.party] || "#333";
              const pct = totalCityVotes > 0 ? ((Number(voteInputs[`${selectedCity}-${can.no}`] || 0) / totalCityVotes) * 100).toFixed(1) : "0.0";
              return (
                <div key={can.no} className="bg-[#0f0f0f] border-2 border-zinc-900 p-2 flex items-center gap-6 group hover:border-[#CC0000] transition-all relative">
                   {autoFetch && <div className="absolute inset-0 bg-black/10 z-10" />}
                  <div className="w-20 h-20 bg-white shrink-0 p-1 border-4 relative" style={{ borderColor: partyColor }}>
                    <img src={`/candidates/${(can.name || "").toLowerCase().replace(/ /g, "_")}.png`} className="w-full h-full object-contain object-bottom" alt="" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-black text-white px-3 py-1 uppercase italic" style={{ backgroundColor: partyColor }}>{can.party}</span>
                    <h3 className="text-2xl font-black uppercase tracking-tighter mt-2 truncate">{can.name}</h3>
                  </div>
                  <div className="bg-black px-6 py-4 flex items-center gap-8 border-l-2 border-zinc-900 shrink-0">
                    <span className="text-emerald-500 font-black text-3xl tabular-nums">{pct}%</span>
                    <input disabled={autoFetch} type="number" value={voteInputs[`${selectedCity}-${can.no}`] || ""} onChange={(e) => setVoteInputs({...voteInputs, [`${selectedCity}-${can.no}`]: e.target.value})} className="bg-[#050505] border-4 border-zinc-800 p-4 w-44 text-5xl font-black text-white text-right outline-none focus:border-[#CC0000] tabular-nums disabled:opacity-50" placeholder="0" />
                    <button disabled={autoFetch} onClick={() => pushMayor(can)} className="bg-[#CC0000] hover:bg-white hover:text-black text-white font-black italic px-10 py-7 text-sm uppercase transition-all active:scale-95 shadow-lg disabled:bg-zinc-800 disabled:text-zinc-600">PUSH</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* REFERENDUM CONTROL AREA */}
        <div className="col-span-3 space-y-4">
          <div className="bg-[#CC0000] p-6 shadow-[8px_8px_0px_#440000] rounded-br-[40px]">
            <h2 className="font-black italic text-2xl uppercase tracking-tighter mb-10">National Referendum</h2>
            <div className="flex justify-between items-end border-t-2 border-white/20 pt-6">
              <div className="text-6xl font-black tabular-nums tracking-tighter"> {(((Number(refData.yes) + Number(refData.no)) / ELIGIBLE_VOTERS) * 100).toFixed(2)}% </div>
              <div className="text-[10px] font-black uppercase opacity-60 mb-2">Turnout</div>
            </div>
          </div>
          <div className="bg-[#111] border-2 border-zinc-800 p-6 space-y-8 shadow-2xl relative">
            {autoFetch && <div className="absolute inset-0 bg-black/40 z-10 backdrop-blur-[1px] flex items-center justify-center font-black text-emerald-500 italic text-xs tracking-widest uppercase">Auto-Syncing...</div>}
            <div className="space-y-3">
              <span className="text-[10px] font-black text-zinc-600 uppercase block underline decoration-[#CC0000] decoration-2 underline-offset-4">Reported Boxes</span>
              <input disabled={autoFetch} type="number" value={refData.boxes} onChange={(e) => setRefData({...refData, boxes: e.target.value})} className="w-full bg-black border-4 border-zinc-800 p-6 font-black text-6xl text-[#CC0000] outline-none tabular-nums focus:border-red-600 disabled:opacity-50" placeholder="0" />
            </div>
            <div className="space-y-4">
              <div className="p-6 bg-zinc-950 border-l-[12px] border-emerald-600">
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">YES Votes</span>
                <input disabled={autoFetch} type="number" value={refData.yes} onChange={(e) => setRefData({...refData, yes: e.target.value})} className="w-full bg-transparent font-black text-5xl outline-none mt-2 tabular-nums disabled:opacity-50" placeholder="0" />
              </div>
              <div className="p-6 bg-zinc-950 border-l-[12px] border-zinc-700">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">NO Votes</span>
                <input disabled={autoFetch} type="number" value={refData.no} onChange={(e) => setRefData({...refData, no: e.target.value})} className="w-full bg-transparent font-black text-5xl outline-none mt-2 tabular-nums disabled:opacity-50" placeholder="0" />
              </div>
            </div>
            <button disabled={autoFetch} onClick={pushRef} className="w-full py-8 bg-emerald-600 hover:bg-emerald-500 text-white font-black italic uppercase tracking-tighter text-2xl border-b-8 border-emerald-900 active:border-0 transition-all shadow-xl disabled:bg-zinc-800 disabled:border-zinc-900">SAVE NATIONAL DATA</button>
          </div>
        </div>
      </div>
    </div>
  );
}