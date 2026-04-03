"use client";
import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";

interface ReferendumData {
  yes: number;
  no: number;
  boxesReported: number;
  totalBoxes: number;
  turnout: string | number;
}

export function useElectionData() {
  const [mayors, setMayors] = useState<any[]>([]);
  const [referendum, setReferendum] = useState<ReferendumData | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // SMART LOGIC:
    // 1. Check if we are in the browser.
    // 2. Use the current window location's origin (IP or Domain).
    // 3. This ensures it works on 192.168.1.244, localhost, or a real domain.
    const socketUrl = typeof window !== "undefined" ? window.location.origin : "";

    const socket = io(socketUrl, {
      transports: ["websocket"], // Preferred for high-speed broadcast updates
      reconnection: true,
      reconnectionAttempts: 10,
    });

    socket.on("connect", () => {
      console.log(`🟢 Connected to Election Engine: ${socket.id}`);
      setConnected(true);
      // Ask for data immediately upon connection
      socket.emit("get-initial-data");
    });

    socket.on("sync-data", (data: any) => {
      console.log("📥 Data Received:", data);
      if (data.mayors) setMayors(data.mayors);
      if (data.referendum) setReferendum(data.referendum);
    });

    socket.on("disconnect", () => {
      console.warn("🔴 Disconnected from Election Engine");
      setConnected(false);
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Socket Error:", err.message);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const getCityResults = (cityName: string) => {
    const cityData = mayors.filter((m) => m.city === cityName);
    const totalVotes = cityData.reduce((sum, c) => sum + (Number(c.votes) || 0), 0);
    
    // Sort by highest votes for the broadcast leaderboards
    const sorted = [...cityData].sort((a, b) => (Number(b.votes) || 0) - (Number(a.votes) || 0));

    return {
      all: sorted,
      top2: sorted.slice(0, 2),
      totalVotes
    };
  };

  return { 
    mayors, 
    referendum, 
    connected, 
    getCityResults 
  };
}