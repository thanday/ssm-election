import { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";

// 1. Define the interface for Referendum
interface ReferendumData {
  yes: number;
  no: number;
  boxesReported: number;
  totalBoxes: number;
  turnout: string;
}

export function useElectionData() {
  const [mayors, setMayors] = useState<any[]>([]);
  const [referendum, setReferendum] = useState<ReferendumData | null>(null); // Add this state
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io();

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("get-initial-data");
    });

    socket.on("sync-data", (data: any) => {
      if (data.mayors) setMayors(data.mayors);
      if (data.referendum) setReferendum(data.referendum); // Sync the referendum data
    });

    return () => { socket.disconnect(); };
  }, []);

  const getCityResults = (cityName: string) => {
    const cityData = mayors.filter((m) => m.city === cityName);
    const totalVotes = cityData.reduce((sum, c) => sum + (c.votes || 0), 0);
    
    return {
      all: cityData.sort((a, b) => b.votes - a.votes),
      top2: cityData.sort((a, b) => b.votes - a.votes).slice(0, 2),
      totalVotes
    };
  };

  // 2. Add 'referendum' to the return object here
  return { 
    mayors, 
    referendum, // This fixes the TS(2339) error
    connected, 
    getCityResults 
  };
}