"use client";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const ATOLLS = [
    { id: "ha", name: "Haa Alif" }, { id: "hdh", name: "Haa Dhaalu" },
    { id: "sh", name: "Shaviyani" }, { id: "n", name: "Noonu" },
    { id: "r", name: "Raa" }, { id: "b", name: "Baa" },
    { id: "lh", name: "Lhaviyani" }, { id: "k", name: "Kaafu" },
    { id: "aa", name: "Alif Alif" }, { id: "adh", name: "Alif Dhaal" },
    { id: "v", name: "Vaavu" }, { id: "m", name: "Meemu" },
    { id: "f", name: "Faafu" }, { id: "dh", name: "Dhaalu" },
    { id: "th", name: "Thaa" }, { id: "l", name: "Laamu" },
    { id: "ga", name: "Gaafu Alif" }, { id: "gdh", name: "Gaafu Dhaalu" },
    { id: "gn", name: "Gnaviyani" }, { id: "s", name: "Seenu" }
];

const PARTIES = [
    { name: "PNC", color: "#21AC9B" },
    { name: "MDP", color: "#FAB100" },
    { name: "MDA", color: "#F67D1F" },
    { name: "IND", color: "#71717a" },
    { name: "CLEAR", color: "rgba(255,255,255,0.15)" }
];

export default function MapController() {
    const [socket, setSocket] = useState<any>(null);
    const [activeColors, setActiveColors] = useState<Record<string, string>>({});

    useEffect(() => {
        const s = io(window.location.origin, {
            path: "/socket.io/",
            transports: ["websocket"]
        });

        // Sync initial state when opening the controller
        s.on("init-map-state", (state: Record<string, string>) => {
            setActiveColors(state);
        });

        // Listen for changes (even from other controllers) to keep UI in sync
        s.on("map-color-changed", (data: { id: string, hex: string }) => {
            setActiveColors(prev => ({ ...prev, [data.id]: data.hex }));
        });

        s.on("map-reset-complete", () => {
            setActiveColors({});
        });

        setSocket(s);
        return () => { s.disconnect(); };
    }, []);

    const sendColor = (id: string, hex: string) => {
        if (socket) socket.emit("update-atoll-color", { id, hex });
    };

    const resetMap = () => {
        if (socket) socket.emit("reset-atoll-map");
    };

    return (
        <div className="min-h-screen bg-zinc-950 p-6 flex flex-col items-center font-sans text-white select-none">
            <header className="w-full max-w-5xl flex justify-between items-center mb-6 bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
                <div>
                    <h1 className="text-2xl font-black italic uppercase tracking-tighter text-[#84754D]">Map Controller</h1>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Live Sync Enabled</p>
                </div>
                <button onClick={resetMap} className="px-8 py-3 bg-red-950/30 text-red-500 border border-red-900/50 rounded-2xl text-xs font-black uppercase hover:bg-red-900/40 transition-all active:scale-95">
                    Reset All
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 w-full max-w-7xl pb-20">
                {ATOLLS.map(atoll => {
                    const currentColor = activeColors[atoll.id] || "rgba(255,255,255,0.15)";
                    const isColored = currentColor !== "rgba(255,255,255,0.15)";

                    return (
                        <div 
                            key={atoll.id} 
                            className={`bg-zinc-900 p-5 rounded-3xl border-2 transition-all duration-300 flex flex-col gap-4 shadow-xl ${
                                isColored ? "border-white/40 scale-[1.02]" : "border-zinc-800"
                            }`}
                            style={{ boxShadow: isColored ? `0 10px 30px -10px ${currentColor}44` : 'none' }}
                        >
                            <div className="flex justify-between items-center">
                                <span className={`font-black text-xs tracking-widest uppercase transition-colors ${
                                    isColored ? "text-white" : "text-zinc-500"
                                }`}>
                                    {atoll.name}
                                </span>
                                {isColored && (
                                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: currentColor }} />
                                )}
                            </div>

                            <div className="flex gap-2 h-10">
                                {PARTIES.map(p => (
                                    <button 
                                        key={p.name}
                                        onClick={() => sendColor(atoll.id, p.color)}
                                        className={`flex-1 rounded-xl border transition-all relative flex items-center justify-center ${
                                            currentColor === p.color 
                                            ? "border-white scale-110 z-10 shadow-[0_0_15px_rgba(255,255,255,0.3)]" 
                                            : "border-white/5 opacity-60 hover:opacity-100"
                                        }`}
                                        style={{ backgroundColor: p.color }}
                                    >
                                        {currentColor === p.color && (
                                            <svg className="w-4 h-4 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}