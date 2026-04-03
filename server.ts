const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");
const { MongoClient } = require("mongodb");
const axios = require("axios"); 

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const MONGO_URI = "mongodb://localhost:27017";
const client = new MongoClient(MONGO_URI);

app.prepare().then(async () => {
  const httpServer = createServer((req: any, res: any) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    transports: ["websocket", "polling"]
  });

  await client.connect();
  const db = client.db("sstv_election");
  console.log("🟢 SSTV Engine: Database Connected");

  let isAutoFetchEnabled = true;

  // --- MASTER DATA FETCH FUNCTION ---
  async function getAllElectionData() {
    try {
      const mayors = await db.collection("mayors").find({}).toArray();
      const referendum = await db.collection("referendum").findOne({ id: "national-ref-2026" });
      return { 
        mayors: mayors || [], 
        referendum: referendum || null, 
        isAutoFetchEnabled 
      };
    } catch (err) {
      console.error("DB Fetch Error:", err);
      return { mayors: [], referendum: null, isAutoFetchEnabled };
    }
  }

  // --- EXTERNAL DATA SYNC ENGINE ---
  async function fetchExternalData() {
    if (!isAutoFetchEnabled) return;

    try {
      // 1. Sync Mayor Results
      const mayorRes = await axios.get("https://boduninmun-2026.sun.mv/data/results.json");
      const cities = mayorRes.data.cities;

      if (cities && Array.isArray(cities)) {
        for (const city of cities) {
          const cityName = city.short_name.split(' ')[0]; 
          for (const can of city.candidates) {
            const sstvId = `mayor-${cityName}-${can.candidate_number}`.toLowerCase();
            await db.collection("mayors").updateOne(
              { id: sstvId },
              { $set: {
                  id: sstvId,
                  city: cityName,
                  no: can.candidate_number,
                  name: can.full_name,
                  party: can.party_code === "PNC" ? "Congress Party" : can.party_code,
                  votes: can.vote_count,
                  boxesReported: city.counted_ballot_boxes,
                  totalBoxes: city.total_ballot_boxes
              }},
              { upsert: true }
            );
          }
        }
      }

      // 2. Sync Referendum Results
      const refRes = await axios.get("https://boduninmun-2026.sun.mv/data/referendum.json");
      const ref = refRes.data.referendum;
      
      if (ref) {
        await db.collection("referendum").updateOne(
          { id: "national-ref-2026" },
          { $set: {
              id: "national-ref-2026",
              yes: ref.yes_votes,
              no: ref.no_votes,
              boxesReported: ref.counted_ballot_boxes,
              totalBoxes: 588,
              turnout: ref.count_progress_percent
          }},
          { upsert: true }
        );
      }

      const freshData = await getAllElectionData();
      io.emit("sync-data", freshData);
      console.log("📡 Auto-Fetch Sync Complete");
    } catch (err: any) {
      // FIX: Cast err to any to allow .message access for TypeScript build
      console.error("❌ External Fetch Error:", err?.message || "Connection Failed");
    }
  }

  // Auto-sync every 30 seconds
  const syncInterval = setInterval(fetchExternalData, 30000);

  io.on("connection", async (socket: any) => {
    console.log("📺 Device Linked:", socket.id);
    
    socket.emit("sync-data", await getAllElectionData());

    socket.on("toggle-auto-fetch", async (enabled: boolean) => {
      isAutoFetchEnabled = enabled;
      console.log(`🛠️ Mode Changed: ${enabled ? 'AUTO' : 'MANUAL BYPASS'}`);
      io.emit("auto-fetch-status", isAutoFetchEnabled);
      if (enabled) fetchExternalData();
    });

    socket.on("get-initial-data", async () => {
      socket.emit("sync-data", await getAllElectionData());
    });

    socket.on("update-results", async (payload: any) => {
      // BLOCK manual updates if Auto-Fetch is active
      if (isAutoFetchEnabled) return; 

      try {
        const collection = payload.type === "mayors" ? "mayors" : "referendum";
        await db.collection(collection).updateOne(
          { id: payload.data.id }, 
          { $set: payload.data }, 
          { upsert: true }
        );
        io.emit("sync-data", await getAllElectionData());
      } catch (err) {
        console.error("Manual Update Error:", err);
      }
    });

    socket.on("wipe-all-data", async () => {
      await db.collection("mayors").deleteMany({});
      await db.collection("referendum").deleteMany({});
      io.emit("sync-data", { mayors: [], referendum: null, isAutoFetchEnabled });
      console.log("☢️ DATABASE WIPED");
    });

    socket.on("disconnect", () => console.log("❌ Device Unlinked"));
  });

  httpServer.listen(3013, "0.0.0.0", () => {
    console.log("> 🚀 SSTV Production Server Ready on http://localhost:3013");
  });
});