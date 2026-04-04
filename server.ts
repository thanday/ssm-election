import { createServer, IncomingMessage, ServerResponse } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketServer } from "socket.io";
import { MongoClient } from "mongodb";
import axios from "axios";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const MONGO_URI = "mongodb://localhost:27017";
const client = new MongoClient(MONGO_URI);

app.prepare().then(async () => {
  // 1. Create the HTTP Server
  const httpServer = createServer((req: IncomingMessage, res: ServerResponse) => {
    const parsedUrl = parse(req.url || "", true);
    const { pathname } = parsedUrl;

    if (pathname?.startsWith('/socket.io/')) {
      return; 
    }

    handle(req, res, parsedUrl);
  });

  // 2. Initialize Socket.IO (Renamed to SocketServer to avoid naming conflicts)
  const io = new SocketServer(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    transports: ["websocket", "polling"],
    path: "/socket.io/"
  });

  // 3. Connect to MongoDB
  try {
    await client.connect();
    console.log("🟢 SSTV Engine: Database Connected");
  } catch (err) {
    console.error("❌ MongoDB Connection Failed:", err);
  }
  
  const db = client.db("sstv_election");
  let isAutoFetchEnabled = true;

  // --- REST OF YOUR FUNCTIONS (fetchExternalData, etc.) ---
  // Ensure any 'require' inside functions are also removed if they exist.

  async function getAllElectionData() {
    try {
      const mayors = await db.collection("mayors").find({}).toArray();
      const referendum = await db.collection("referendum").findOne({ id: "national-ref-2026" });
      return { mayors: mayors || [], referendum: referendum || null, isAutoFetchEnabled };
    } catch (err) {
      console.error("DB Fetch Error:", err);
      return { mayors: [], referendum: null, isAutoFetchEnabled };
    }
  }

  async function fetchExternalData() {
    if (!isAutoFetchEnabled) return;

    try {
      const mayorRes = await axios.get("https://boduninmun-2026.sun.mv/data/results.json");
      const cities = mayorRes.data.cities;

      if (cities && Array.isArray(cities)) {
        for (const city of cities) {
          const cityName = city.short_name.split(' ')[0].replace(/[^a-zA-Z]/g, "").toLowerCase(); 
          
          for (const can of city.candidates) {
            const sstvId = `mayor-${cityName}-${can.candidate_number}`.toLowerCase();
            
            // --- BROADCAST OVERRIDES ---
            let finalName = can.full_name;
            if (sstvId === "mayor-male-1") finalName = "Ahmed Aiham";
            if (sstvId === "mayor-male-5") finalName = "Abdulla Mahzoom";

            const finalParty = (can.party_code === "PNC" || can.party_code === "Congress Party") ? "PNC" : can.party_code;

            await db.collection("mayors").updateOne(
              { id: sstvId },
              { $set: {
                  id: sstvId,
                  city: city.short_name.split(' ')[0], 
                  no: can.candidate_number,
                  name: finalName,
                  party: finalParty, 
                  votes: can.vote_count,
                  boxesReported: city.counted_ballot_boxes,
                  totalBoxes: city.total_ballot_boxes
              }},
              { upsert: true }
            );
          }
        }
      }

      // Referendum Sync
      const refRes = await axios.get("https://boduninmun-2026.sun.mv/data/referendum.json");
      const ref = refRes.data.referendum;
      if (ref) {
        await db.collection("referendum").updateOne(
          { id: "national-ref-2026" },
          { $set: { id: "national-ref-2026", yes: ref.yes_votes, no: ref.no_votes, boxesReported: ref.counted_ballot_boxes, totalBoxes: 588, turnout: ref.count_progress_percent }},
          { upsert: true }
        );
      }

      const freshData = await getAllElectionData();
      io.emit("sync-data", freshData);
      console.log("📡 Auto-Fetch Sync Complete");
    } catch (err: any) {
      console.error("❌ External Fetch Error:", err?.message || "Connection Failed");
    }
  }

  const syncInterval = setInterval(fetchExternalData, 30000);

  io.on("connection", async (socket: any) => {
    console.log("📺 Device Linked:", socket.id);
    socket.emit("sync-data", await getAllElectionData());
    socket.on("get-initial-data", async () => socket.emit("sync-data", await getAllElectionData()));
    socket.on("toggle-auto-fetch", async (enabled: boolean) => {
      isAutoFetchEnabled = enabled;
      io.emit("auto-fetch-status", isAutoFetchEnabled);
      if (enabled) fetchExternalData();
    });
    socket.on("disconnect", () => console.log("❌ Device Unlinked"));
  });

  httpServer.listen(3013, "0.0.0.0", () => {
    console.log("> 🚀 SSTV Production Server Ready on http://192.168.1.244:3013");
  });
});